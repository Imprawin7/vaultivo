package com.vaultivo.service;

import com.vaultivo.dto.*;
import com.vaultivo.exception.DuplicateNameException;
import com.vaultivo.exception.ForbiddenException;
import com.vaultivo.exception.InvalidFolderMoveException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.File;
import com.vaultivo.model.Folder;
import com.vaultivo.model.User;
import com.vaultivo.repository.FileRepository;
import com.vaultivo.repository.FolderRepository;
import com.vaultivo.repository.UserRepository;
import com.vaultivo.security.AccessLevel;
import com.vaultivo.security.PermissionService;
import com.vaultivo.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final PermissionService permissionService;

    @Transactional
    public FolderResponse createFolder(UUID userId, FolderCreateRequest request) {
        UUID ownerId = userId;

        if (request.parentId() != null) {
            // Creating inside someone else's shared folder requires EDITOR there.
            Folder parent = permissionService.requireFolderAccess(userId, request.parentId(), AccessLevel.EDITOR);
            // The whole subtree stays under one owner (the folder owner) so
            // quota and per-owner uniqueness constraints stay consistent —
            // see the note on File creation below for the same rule.
            ownerId = parent.getOwnerId();
        }

        assertNameAvailable(ownerId, request.parentId(), request.name());

        Folder folder = Folder.builder()
                .ownerId(ownerId)
                .parentId(request.parentId())
                .name(request.name())
                .trashed(false)
                .build();

        return FolderResponse.from(folderRepository.save(folder));
    }

    public FolderDetailResponse getFolderDetail(UUID userId, UUID folderId) {
        Folder folder = permissionService.requireFolderAccess(userId, folderId, AccessLevel.VIEWER);
        UUID ownerId = folder.getOwnerId();

        List<BreadcrumbItem> breadcrumb = folderRepository.findBreadcrumbIds(folderId).stream()
                .map(id -> folderRepository.findById(id).orElseThrow())
                .map(f -> new BreadcrumbItem(f.getId(), f.getName()))
                .toList();

        List<FolderResponse> childFolders =
                folderRepository.findByOwnerIdAndParentIdAndTrashedFalseOrderByNameAsc(ownerId, folderId)
                        .stream().map(FolderResponse::from).toList();

        List<FileResponse> childFiles =
                fileRepository.findByOwnerIdAndFolderIdAndTrashedFalseOrderByNameAsc(ownerId, folderId)
                        .stream().map(FileResponse::from).toList();

        return new FolderDetailResponse(FolderResponse.from(folder), breadcrumb, childFolders, childFiles);
    }

    /** Root-level listing — always the requesting user's own root (root has no sharing concept). */
    public FolderDetailResponse getRootDetail(UUID userId) {
        List<FolderResponse> childFolders =
                folderRepository.findByOwnerIdAndParentIdIsNullAndTrashedFalseOrderByNameAsc(userId)
                        .stream().map(FolderResponse::from).toList();

        List<FileResponse> childFiles =
                fileRepository.findByOwnerIdAndFolderIdIsNullAndTrashedFalseOrderByNameAsc(userId)
                        .stream().map(FileResponse::from).toList();

        return new FolderDetailResponse(null, List.of(), childFolders, childFiles);
    }

    @Transactional
    public FolderResponse updateFolder(UUID userId, UUID folderId, FolderUpdateRequest request) {
        Folder folder = permissionService.requireFolderAccess(userId, folderId, AccessLevel.EDITOR);
        UUID ownerId = folder.getOwnerId();

        UUID targetParentId = folder.getParentId();
        boolean moving = request.parentId() != null || request.moveToRoot();

        if (moving) {
            targetParentId = request.moveToRoot() ? null : request.parentId();
            validateMove(userId, folder, targetParentId);
        }

        String targetName = request.name() != null ? request.name() : folder.getName();

        boolean locationChanged = !java.util.Objects.equals(targetParentId, folder.getParentId());
        boolean nameChanged = !targetName.equals(folder.getName());
        if (locationChanged || nameChanged) {
            assertNameAvailable(ownerId, targetParentId, targetName);
        }

        folder.setParentId(targetParentId);
        folder.setName(targetName);

        return FolderResponse.from(folderRepository.save(folder));
    }

    @Transactional
    public void trashFolder(UUID userId, UUID folderId) {
        // Trashing is destructive enough to require EDITOR at minimum; owner-only
        // would be stricter but Google Drive lets Editors delete too — see the
        // open question flagged at the end of Step 1.
        permissionService.requireFolderAccess(userId, folderId, AccessLevel.EDITOR);
        Instant now = Instant.now();
        folderRepository.trashSubtree(folderId, now);
        folderRepository.trashFilesInSubtree(folderId, now);
    }

    @Transactional
    public FolderResponse restoreFolder(UUID userId, UUID folderId) {
        Folder folder = permissionService.requireFolderAccess(userId, folderId, AccessLevel.EDITOR);
        assertNameAvailable(folder.getOwnerId(), folder.getParentId(), folder.getName());
        folder.setTrashed(false);
        folder.setTrashedAt(null);
        return FolderResponse.from(folderRepository.save(folder));
    }

    public List<FolderResponse> search(UUID ownerId, String query) {
        return folderRepository.searchByName(ownerId, query).stream().map(FolderResponse::from).toList();
    }

    public List<FolderResponse> listTrashed(UUID ownerId) {
        return folderRepository.findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(ownerId)
                .stream().map(FolderResponse::from).toList();
    }

    /**
     * Irreversible — deletes every S3 object in the subtree, refunds the
     * owner's quota, then deletes this folder's row. Descendant folder/file
     * rows are removed automatically via ON DELETE CASCADE (schema.sql).
     */
    @Transactional
    public void permanentlyDeleteFolder(UUID userId, UUID folderId) {
        Folder folder = permissionService.requireFolderAccess(userId, folderId, AccessLevel.OWNER);

        List<UUID> subtreeFolderIds = folderRepository.findDescendantIdsIncludingSelf(folderId);
        List<File> filesInSubtree = fileRepository.findByFolderIdIn(subtreeFolderIds);

        long totalBytes = filesInSubtree.stream().mapToLong(File::getSizeBytes).sum();
        filesInSubtree.forEach(f -> storageService.deleteObject(f.getStorageKey()));

        User owner = userRepository.findById(folder.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + folder.getOwnerId()));
        owner.setStorageUsedBytes(Math.max(0, owner.getStorageUsedBytes() - totalBytes));
        userRepository.save(owner);

        folderRepository.delete(folder);
    }

    /**
     * Top-level trashed folders only — i.e. folders the user explicitly
     * trashed, excluding ones only trashed as a side effect of an ancestor
     * being trashed. Used by TrashService.emptyTrash() so permanent deletion
     * happens once per subtree instead of redundantly per descendant.
     */
    List<Folder> listTopLevelTrashed(UUID ownerId) {
        List<Folder> trashed = folderRepository.findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(ownerId);
        Set<UUID> trashedIds = trashed.stream().map(Folder::getId).collect(java.util.stream.Collectors.toSet());
        return trashed.stream()
                .filter(f -> f.getParentId() == null || !trashedIds.contains(f.getParentId()))
                .toList();
    }

    // ---------------------------------------------------------------

    private void assertNameAvailable(UUID ownerId, UUID parentId, String name) {
        boolean exists = parentId == null
                ? folderRepository.existsByOwnerIdAndParentIdIsNullAndNameAndTrashedFalse(ownerId, name)
                : folderRepository.existsByOwnerIdAndParentIdAndNameAndTrashedFalse(ownerId, parentId, name);
        if (exists) {
            throw new DuplicateNameException(name);
        }
    }

    private void validateMove(UUID userId, Folder folder, UUID targetParentId) {
        if (targetParentId == null) {
            return;
        }
        if (targetParentId.equals(folder.getId())) {
            throw new InvalidFolderMoveException("A folder cannot be moved into itself");
        }

        // Moving requires at least EDITOR on the destination too.
        permissionService.requireFolderAccess(userId, targetParentId, AccessLevel.EDITOR);

        List<UUID> descendantsIncludingSelf = folderRepository.findDescendantIdsIncludingSelf(folder.getId());
        if (descendantsIncludingSelf.contains(targetParentId)) {
            throw new InvalidFolderMoveException("A folder cannot be moved into one of its own subfolders");
        }
    }
}
