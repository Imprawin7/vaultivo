package com.vaultivo.service;

import com.vaultivo.activity.ActivityAction;
import com.vaultivo.activity.ActivityLogService;
import com.vaultivo.dto.*;
import com.vaultivo.exception.DuplicateNameException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.exception.StorageQuotaExceededException;
import com.vaultivo.model.File;
import com.vaultivo.model.Folder;
import com.vaultivo.model.UploadAttempt;
import com.vaultivo.model.User;
import com.vaultivo.repository.FileRepository;
import com.vaultivo.repository.FileVersionRepository;
import com.vaultivo.repository.UploadAttemptRepository;
import com.vaultivo.repository.UserRepository;
import com.vaultivo.security.AccessLevel;
import com.vaultivo.security.PermissionService;
import com.vaultivo.storage.PresignedDownload;
import com.vaultivo.storage.PresignedUpload;
import com.vaultivo.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FileVersionRepository fileVersionRepository;
    private final UserRepository userRepository;
    private final UploadAttemptRepository uploadAttemptRepository;
    private final PermissionService permissionService;
    private final StorageService storageService;
    private final ActivityLogService activityLogService;

    @Transactional
    public InitUploadResponse initUpload(UUID userId, InitUploadRequest request) {
        UUID ownerId = userId;

        if (request.folderId() != null) {
            Folder folder = permissionService.requireFolderAccess(userId, request.folderId(), AccessLevel.EDITOR);
            // Uploads into a shared folder are billed against the folder
            // owner's quota, not the uploader's — same rule as folder creation.
            ownerId = folder.getOwnerId();
        }

        User owner = requireUser(ownerId);
        assertQuotaAvailable(owner, request.sizeBytes());
        assertNameAvailable(ownerId, request.folderId(), request.name());

        String objectKey = storageService.generateObjectKey(ownerId, request.name());
        PresignedUpload presigned =
                storageService.createPresignedUploadUrl(objectKey, request.mimeType(), request.sizeBytes());

        // Recorded PENDING here so an abandoned upload (client never calls
        // complete-upload, or the S3 PUT itself fails) is still visible to
        // admins — see AdminService.failedUploads().
        uploadAttemptRepository.save(UploadAttempt.builder()
                .ownerId(ownerId)
                .name(request.name())
                .sizeBytes(request.sizeBytes())
                .storageKey(objectKey)
                .status(UploadAttempt.Status.PENDING)
                .build());

        return new InitUploadResponse(presigned.storageKey(), presigned.uploadUrl(), presigned.expiresAt());
    }

    @Transactional
    public FileResponse completeUpload(UUID userId, CompleteUploadRequest request) {
        UUID ownerId = userId;

        if (request.folderId() != null) {
            Folder folder = permissionService.requireFolderAccess(userId, request.folderId(), AccessLevel.EDITOR);
            ownerId = folder.getOwnerId();
        }

        User owner = requireUser(ownerId);
        assertQuotaAvailable(owner, request.sizeBytes());

        File file = File.builder()
                .ownerId(ownerId)
                .folderId(request.folderId())
                .name(request.name())
                .mimeType(request.mimeType())
                .sizeBytes(request.sizeBytes())
                .storageKey(request.storageKey())
                .currentVersion(1)
                .checksumSha256(request.checksumSha256())
                .starred(false)
                .trashed(false)
                .build();

        try {
            file = fileRepository.save(file);
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateNameException(request.name());
        }

        owner.setStorageUsedBytes(owner.getStorageUsedBytes() + request.sizeBytes());
        userRepository.save(owner);

        uploadAttemptRepository.findByStorageKey(request.storageKey()).ifPresent(attempt -> {
            attempt.setStatus(UploadAttempt.Status.COMPLETED);
            attempt.setCompletedAt(Instant.now());
            uploadAttemptRepository.save(attempt);
        });

        activityLogService.log(userId, ActivityAction.UPLOAD_FILE, file.getId(), file.getFolderId(),
                java.util.Map.of("name", file.getName(), "sizeBytes", request.sizeBytes()));

        return FileResponse.from(file);
    }

    public FileResponse getFile(UUID userId, UUID fileId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.VIEWER);
        return FileResponse.from(file);
    }

    public DownloadUrlResponse getDownloadUrl(UUID userId, UUID fileId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.VIEWER);
        PresignedDownload presigned =
                storageService.createPresignedDownloadUrl(file.getStorageKey(), file.getName());
        activityLogService.log(userId, ActivityAction.DOWNLOAD_FILE, file.getId(), file.getFolderId(), null);
        return new DownloadUrlResponse(presigned.downloadUrl(), presigned.expiresAt());
    }

    /** Same access rule as download — Content-Disposition: inline instead of attachment. */
    public DownloadUrlResponse getPreviewUrl(UUID userId, UUID fileId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.VIEWER);
        PresignedDownload presigned =
                storageService.createPresignedPreviewUrl(file.getStorageKey(), file.getName());
        return new DownloadUrlResponse(presigned.downloadUrl(), presigned.expiresAt());
    }

    @Transactional
    public FileResponse updateFile(UUID userId, UUID fileId, FileUpdateRequest request) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.EDITOR);
        UUID ownerId = file.getOwnerId();

        UUID targetFolderId = file.getFolderId();
        boolean moving = request.folderId() != null || request.moveToRoot();
        if (moving) {
            targetFolderId = request.moveToRoot() ? null : request.folderId();
            if (targetFolderId != null) {
                permissionService.requireFolderAccess(userId, targetFolderId, AccessLevel.EDITOR);
            }
        }

        String targetName = request.name() != null ? request.name() : file.getName();

        boolean locationChanged = !java.util.Objects.equals(targetFolderId, file.getFolderId());
        boolean nameChanged = !targetName.equals(file.getName());
        if (locationChanged || nameChanged) {
            assertNameAvailable(ownerId, targetFolderId, targetName);
        }

        file.setFolderId(targetFolderId);
        file.setName(targetName);
        if (request.starred() != null) {
            // Starring is per-user in spirit, but the MVP schema models it as a
            // flag on the file itself (see files.is_starred in schema.sql), so
            // it is effectively shared across anyone with access. Acceptable
            // for MVP; a proper per-user star needs the `stars` join table.
            boolean starChanged = request.starred() != file.isStarred();
            file.setStarred(request.starred());
            if (starChanged) {
                activityLogService.log(userId, request.starred() ? ActivityAction.STAR_FILE : ActivityAction.UNSTAR_FILE,
                        file.getId(), file.getFolderId(), null);
            }
        }

        if (nameChanged) {
            activityLogService.log(userId, ActivityAction.RENAME_FILE, file.getId(), file.getFolderId(),
                    java.util.Map.of("newName", targetName));
        }
        if (locationChanged) {
            activityLogService.log(userId, ActivityAction.MOVE_FILE, file.getId(), targetFolderId, null);
        }

        return FileResponse.from(fileRepository.save(file));
    }

    @Transactional
    public void trashFile(UUID userId, UUID fileId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.EDITOR);
        file.setTrashed(true);
        file.setTrashedAt(Instant.now());
        fileRepository.save(file);
        activityLogService.log(userId, ActivityAction.TRASH_FILE, file.getId(), file.getFolderId(), null);
    }

    @Transactional
    public FileResponse restoreFile(UUID userId, UUID fileId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.EDITOR);
        assertNameAvailable(file.getOwnerId(), file.getFolderId(), file.getName());
        file.setTrashed(false);
        file.setTrashedAt(null);
        FileResponse response = FileResponse.from(fileRepository.save(file));
        activityLogService.log(userId, ActivityAction.RESTORE_FILE, file.getId(), file.getFolderId(), null);
        return response;
    }

    /**
     * Irreversible — restricted to OWNER only, unlike trash which Editors
     * can also do. Cleans up every archived version's S3 object too, not
     * just the current one — those objects were never deleted when the file
     * was replaced (see FileVersionService), so they'd otherwise leak.
     */
    @Transactional
    public void permanentlyDeleteFile(UUID userId, UUID fileId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.OWNER);
        User owner = requireUser(file.getOwnerId());

        List<com.vaultivo.model.FileVersion> versions = fileVersionRepository.findByFileId(fileId);

        // Dedupe by storage key for BOTH the S3 deletes and the refund sum —
        // a restored version reuses an older key directly (no re-upload),
        // so that key would otherwise be double-counted here even though
        // it's a single S3 object that was only ever charged once.
        java.util.Map<String, Long> sizeByKey = new java.util.HashMap<>();
        sizeByKey.put(file.getStorageKey(), file.getSizeBytes());
        versions.forEach(v -> sizeByKey.put(v.getStorageKey(), v.getSizeBytes()));
        sizeByKey.keySet().forEach(storageService::deleteObject);

        long totalBytes = sizeByKey.values().stream().mapToLong(Long::longValue).sum();

        fileRepository.delete(file); // cascades file_versions rows at the DB level (ON DELETE CASCADE)

        long refunded = Math.max(0, owner.getStorageUsedBytes() - totalBytes);
        owner.setStorageUsedBytes(refunded);
        userRepository.save(owner);

        activityLogService.log(userId, ActivityAction.DELETE_FILE_PERMANENT, null, null,
                java.util.Map.of("name", file.getName()));
    }

    public List<FileResponse> search(UUID ownerId, String query) {
        return fileRepository.searchByName(ownerId, query).stream().map(FileResponse::from).toList();
    }

    public List<FileResponse> listStarred(UUID ownerId) {
        return fileRepository.findByOwnerIdAndStarredTrueAndTrashedFalseOrderByNameAsc(ownerId)
                .stream().map(FileResponse::from).toList();
    }

    public List<FileResponse> listTrashed(UUID ownerId) {
        return fileRepository.findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(ownerId)
                .stream().map(FileResponse::from).toList();
    }

    // ---------------------------------------------------------------

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void assertQuotaAvailable(User user, long additionalBytes) {
        if (user.getStorageUsedBytes() + additionalBytes > user.getStorageQuotaBytes()) {
            throw new StorageQuotaExceededException();
        }
    }

    private void assertNameAvailable(UUID ownerId, UUID folderId, String name) {
        boolean exists = folderId == null
                ? fileRepository.existsByOwnerIdAndFolderIdIsNullAndNameAndTrashedFalse(ownerId, name)
                : fileRepository.existsByOwnerIdAndFolderIdAndNameAndTrashedFalse(ownerId, folderId, name);
        if (exists) {
            throw new DuplicateNameException(name);
        }
    }
}
