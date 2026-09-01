package com.vaultivo.service;

import com.vaultivo.activity.ActivityAction;
import com.vaultivo.activity.ActivityLogService;
import com.vaultivo.dto.*;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.File;
import com.vaultivo.model.FileVersion;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Content is never overwritten in place — replacing or restoring always
 * archives the OUTGOING content as a new file_versions row rather than
 * deleting it, so history is append-only (like git). Quota accounting
 * follows from that: uploading genuinely NEW bytes charges quota; restoring
 * an old version reuses an S3 object that was already counted, so it's a
 * quota no-op. Only a permanent delete of the whole file refunds everything
 * at once (see FileService.permanentlyDeleteFile).
 */
@Service
@RequiredArgsConstructor
public class FileVersionService {

    private final FileRepository fileRepository;
    private final FileVersionRepository fileVersionRepository;
    private final UserRepository userRepository;
    private final UploadAttemptRepository uploadAttemptRepository;
    private final PermissionService permissionService;
    private final StorageService storageService;
    private final ActivityLogService activityLogService;

    @Transactional
    public InitUploadResponse initVersionUpload(UUID userId, UUID fileId, InitVersionUploadRequest request) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.EDITOR);
        User owner = requireUser(file.getOwnerId());
        assertQuotaAvailable(owner, request.sizeBytes());

        String objectKey = storageService.generateObjectKey(file.getOwnerId(), file.getName());
        PresignedUpload presigned =
                storageService.createPresignedUploadUrl(objectKey, request.mimeType(), request.sizeBytes());

        uploadAttemptRepository.save(UploadAttempt.builder()
                .ownerId(file.getOwnerId())
                .name(file.getName())
                .sizeBytes(request.sizeBytes())
                .storageKey(objectKey)
                .status(UploadAttempt.Status.PENDING)
                .build());

        return new InitUploadResponse(presigned.storageKey(), presigned.uploadUrl(), presigned.expiresAt());
    }

    @Transactional
    public FileResponse completeVersionUpload(UUID userId, UUID fileId, CompleteVersionUploadRequest request) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.EDITOR);
        User owner = requireUser(file.getOwnerId());
        assertQuotaAvailable(owner, request.sizeBytes());

        // Archive the OUTGOING content before overwriting the live row.
        fileVersionRepository.save(FileVersion.builder()
                .fileId(file.getId())
                .versionNumber(file.getCurrentVersion())
                .storageKey(file.getStorageKey())
                .sizeBytes(file.getSizeBytes())
                .checksumSha256(file.getChecksumSha256())
                .uploadedBy(userId)
                .build());

        file.setStorageKey(request.storageKey());
        file.setSizeBytes(request.sizeBytes());
        file.setMimeType(request.mimeType());
        file.setChecksumSha256(request.checksumSha256());
        file.setCurrentVersion(file.getCurrentVersion() + 1);
        fileRepository.save(file);

        owner.setStorageUsedBytes(owner.getStorageUsedBytes() + request.sizeBytes());
        userRepository.save(owner);

        uploadAttemptRepository.findByStorageKey(request.storageKey()).ifPresent(attempt -> {
            attempt.setStatus(UploadAttempt.Status.COMPLETED);
            attempt.setCompletedAt(java.time.Instant.now());
            uploadAttemptRepository.save(attempt);
        });

        activityLogService.log(userId, ActivityAction.UPLOAD_FILE_VERSION, file.getId(), file.getFolderId(),
                java.util.Map.of("versionNumber", file.getCurrentVersion()));

        return FileResponse.from(file);
    }

    public List<FileVersionResponse> listVersions(UUID userId, UUID fileId) {
        permissionService.requireFileAccess(userId, fileId, AccessLevel.VIEWER);
        return fileVersionRepository.findByFileIdOrderByVersionNumberDesc(fileId).stream()
                .map(v -> FileVersionResponse.from(v, resolveEmail(v.getUploadedBy())))
                .toList();
    }

    public DownloadUrlResponse getVersionDownloadUrl(UUID userId, UUID fileId, UUID versionId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.VIEWER);
        FileVersion version = requireVersion(fileId, versionId);
        PresignedDownload presigned =
                storageService.createPresignedDownloadUrl(version.getStorageKey(), file.getName());
        return new DownloadUrlResponse(presigned.downloadUrl(), presigned.expiresAt());
    }

    /**
     * Restores an old version as the live content. The current content is
     * archived as a new version (not discarded), and the file points back
     * at the old version's S3 object directly — no re-upload, no new quota
     * charge, since that object already exists and was already counted.
     */
    @Transactional
    public FileResponse restoreVersion(UUID userId, UUID fileId, UUID versionId) {
        File file = permissionService.requireFileAccess(userId, fileId, AccessLevel.EDITOR);
        FileVersion target = requireVersion(fileId, versionId);

        fileVersionRepository.save(FileVersion.builder()
                .fileId(file.getId())
                .versionNumber(file.getCurrentVersion())
                .storageKey(file.getStorageKey())
                .sizeBytes(file.getSizeBytes())
                .checksumSha256(file.getChecksumSha256())
                .uploadedBy(userId)
                .build());

        file.setStorageKey(target.getStorageKey());
        file.setSizeBytes(target.getSizeBytes());
        file.setChecksumSha256(target.getChecksumSha256());
        file.setCurrentVersion(file.getCurrentVersion() + 1);

        FileResponse response = FileResponse.from(fileRepository.save(file));
        activityLogService.log(userId, ActivityAction.RESTORE_FILE_VERSION, file.getId(), file.getFolderId(),
                java.util.Map.of("restoredFromVersion", target.getVersionNumber()));
        return response;
    }

    // ---------------------------------------------------------------

    private FileVersion requireVersion(UUID fileId, UUID versionId) {
        FileVersion version = fileVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found: " + versionId));
        if (!version.getFileId().equals(fileId)) {
            throw new ResourceNotFoundException("Version not found: " + versionId);
        }
        return version;
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void assertQuotaAvailable(User user, long additionalBytes) {
        if (user.getStorageUsedBytes() + additionalBytes > user.getStorageQuotaBytes()) {
            throw new com.vaultivo.exception.StorageQuotaExceededException();
        }
    }

    private String resolveEmail(UUID userId) {
        return userRepository.findById(userId).map(User::getEmail).orElse("(deleted user)");
    }
}
