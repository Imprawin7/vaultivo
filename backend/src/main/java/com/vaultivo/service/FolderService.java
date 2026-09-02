package com.vaultivo.service;

import com.vaultivo.activity.ActivityAction;
import com.vaultivo.activity.ActivityLogService;
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
    private final ActivityLogService activityLogService;

    // ---------------------------------------------------------------
    // Create folder
    // ---------------------------------------------------------------

    @Transactional
    public FolderResponse createFolder(UUID userId, FolderCreateRequest request) {

        UUID ownerId = userId;

        if (request.parentId() != null) {
            // Creating inside someone else's shared folder requires EDITOR there.
            Folder parent = permissionService.requireFolderAccess(
                    userId,
                    request.parentId(),
                    AccessLevel.EDITOR
            );

            // The whole subtree stays under one owner (the folder owner)
            // so quota and per-owner uniqueness constraints stay consistent.
            ownerId = parent.getOwnerId();
        }

        assertNameAvailable(
                ownerId,
                request.parentId(),
                request.name()
        );

        Folder folder = Folder.builder()
                .ownerId(ownerId)
                .parentId(request.parentId())
                .name(request.name())
                .trashed(false)
                .build();

        folder = folderRepository.save(folder);

        // Audit: folder created
        activityLogService.log(
                userId,
                ActivityAction.CREATE_FOLDER,
                null,
                folder.getId(),
                java.util.Map.of(
                        "name", folder.getName()
                )
        );

        return FolderResponse.from(folder);
    }

    // ---------------------------------------------------------------
    // Folder detail
    // ---------------------------------------------------------------

    public FolderDetailResponse getFolderDetail(UUID userId, UUID folderId) {

        Folder folder = permissionService.requireFolderAccess(
                userId,
                folderId,
                AccessLevel.VIEWER
        );

        UUID ownerId = folder.getOwnerId();

        List<BreadcrumbItem> breadcrumb =
                folderRepository.findBreadcrumbIds(folderId)
                        .stream()
                        .map(id -> folderRepository.findById(id).orElseThrow())
                        .map(f -> new BreadcrumbItem(f.getId(), f.getName()))
                        .toList();

        List<FolderResponse> childFolders =
                folderRepository
                        .findByOwnerIdAndParentIdAndTrashedFalseOrderByNameAsc(
                                ownerId,
                                folderId
                        )
                        .stream()
                        .map(FolderResponse::from)
                        .toList();

        List<FileResponse> childFiles =
                fileRepository
                        .findByOwnerIdAndFolderIdAndTrashedFalseOrderByNameAsc(
                                ownerId,
                                folderId
                        )
                        .stream()
                        .map(FileResponse::from)
                        .toList();

        return new FolderDetailResponse(
                FolderResponse.from(folder),
                breadcrumb,
                childFolders,
                childFiles
        );
    }

    // ---------------------------------------------------------------
    // Root folder detail
    // ---------------------------------------------------------------

    /**
     * Root-level listing — always the requesting user's own root
     * (root has no sharing concept).
     */
    public FolderDetailResponse getRootDetail(UUID userId) {

        List<FolderResponse> childFolders =
                folderRepository
                        .findByOwnerIdAndParentIdIsNullAndTrashedFalseOrderByNameAsc(
                                userId
                        )
                        .stream()
                        .map(FolderResponse::from)
                        .toList();

        List<FileResponse> childFiles =
                fileRepository
                        .findByOwnerIdAndFolderIdIsNullAndTrashedFalseOrderByNameAsc(
                                userId
                        )
                        .stream()
                        .map(FileResponse::from)
                        .toList();

        return new FolderDetailResponse(
                null,
                List.of(),
                childFolders,
                childFiles
        );
    }

    // ---------------------------------------------------------------
    // Update / rename / move folder
    // ---------------------------------------------------------------

    @Transactional
    public FolderResponse updateFolder(
            UUID userId,
            UUID folderId,
            FolderUpdateRequest request
    ) {

        Folder folder = permissionService.requireFolderAccess(
                userId,
                folderId,
                AccessLevel.EDITOR
        );

        UUID ownerId = folder.getOwnerId();
        UUID targetParentId = folder.getParentId();

        boolean moving =
                request.parentId() != null || request.moveToRoot();

        if (moving) {
            targetParentId =
                    request.moveToRoot()
                            ? null
                            : request.parentId();

            validateMove(
                    userId,
                    folder,
                    targetParentId
            );
        }

        String targetName =
                request.name() != null
                        ? request.name()
                        : folder.getName();

        boolean locationChanged =
                !java.util.Objects.equals(
                        targetParentId,
                        folder.getParentId()
                );

        boolean nameChanged =
                !targetName.equals(folder.getName());

        if (locationChanged || nameChanged) {
            assertNameAvailable(
                    ownerId,
                    targetParentId,
                    targetName
            );
        }

        folder.setParentId(targetParentId);
        folder.setName(targetName);

        folder = folderRepository.save(folder);

        // Audit: folder renamed
        if (nameChanged) {
            activityLogService.log(
                    userId,
                    ActivityAction.RENAME_FOLDER,
                    null,
                    folder.getId(),
                    java.util.Map.of(
                            "newName",
                            targetName
                    )
            );
        }

        // Audit: folder moved
        if (locationChanged) {
            activityLogService.log(
                    userId,
                    ActivityAction.MOVE_FOLDER,
                    null,
                    folder.getId(),
                    null
            );
        }

        return FolderResponse.from(folder);
    }

    // ---------------------------------------------------------------
    // Trash folder
    // ---------------------------------------------------------------

    @Transactional
    public void trashFolder(UUID userId, UUID folderId) {

        // Trashing is destructive enough to require EDITOR at minimum.
        permissionService.requireFolderAccess(
                userId,
                folderId,
                AccessLevel.EDITOR
        );

        Instant now = Instant.now();

        folderRepository.trashSubtree(
                folderId,
                now
        );

        folderRepository.trashFilesInSubtree(
                folderId,
                now
        );

        // Audit: folder trashed
        activityLogService.log(
                userId,
                ActivityAction.TRASH_FOLDER,
                null,
                folderId,
                null
        );
    }

    // ---------------------------------------------------------------
    // Restore folder
    // ---------------------------------------------------------------

    @Transactional
    public FolderResponse restoreFolder(UUID userId, UUID folderId) {

        Folder folder = permissionService.requireFolderAccess(
                userId,
                folderId,
                AccessLevel.EDITOR
        );

        assertNameAvailable(
                folder.getOwnerId(),
                folder.getParentId(),
                folder.getName()
        );

        folder.setTrashed(false);
        folder.setTrashedAt(null);

        folder = folderRepository.save(folder);

        // Audit: folder restored
        activityLogService.log(
                userId,
                ActivityAction.RESTORE_FOLDER,
                null,
                folder.getId(),
                null
        );

        return FolderResponse.from(folder);
    }

    // ---------------------------------------------------------------
    // Search
    // ---------------------------------------------------------------

    public List<FolderResponse> search(UUID ownerId, String query) {

        return folderRepository
                .searchByName(ownerId, query)
                .stream()
                .map(FolderResponse::from)
                .toList();
    }

    // ---------------------------------------------------------------
    // List trashed folders
    // ---------------------------------------------------------------

    public List<FolderResponse> listTrashed(UUID ownerId) {

        return folderRepository
                .findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(ownerId)
                .stream()
                .map(FolderResponse::from)
                .toList();
    }

    // ---------------------------------------------------------------
    // Permanently delete folder
    // ---------------------------------------------------------------

    /**
     * Irreversible — deletes every S3 object in the subtree, refunds the
     * owner's quota, then deletes this folder's row.
     *
     * Descendant folder/file rows are removed automatically via
     * ON DELETE CASCADE (schema.sql).
     */
    @Transactional
    public void permanentlyDeleteFolder(
            UUID userId,
            UUID folderId
    ) {

        Folder folder = permissionService.requireFolderAccess(
                userId,
                folderId,
                AccessLevel.OWNER
        );

        List<UUID> subtreeFolderIds =
                folderRepository.findDescendantIdsIncludingSelf(
                        folderId
                );

        List<File> filesInSubtree =
                fileRepository.findByFolderIdIn(
                        subtreeFolderIds
                );

        long totalBytes =
                filesInSubtree
                        .stream()
                        .mapToLong(File::getSizeBytes)
                        .sum();

        filesInSubtree.forEach(
                f -> storageService.deleteObject(
                        f.getStorageKey()
                )
        );

        User owner =
                userRepository
                        .findById(folder.getOwnerId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "User not found: "
                                                + folder.getOwnerId()
                                )
                        );

        owner.setStorageUsedBytes(
                Math.max(
                        0,
                        owner.getStorageUsedBytes() - totalBytes
                )
        );

        userRepository.save(owner);

        // Audit BEFORE deleting the folder.
        // This preserves the folder ID/name in the activity record.
        activityLogService.log(
                userId,
                ActivityAction.DELETE_FOLDER_PERMANENT,
                null,
                folder.getId(),
                java.util.Map.of(
                        "name",
                        folder.getName()
                )
        );

        folderRepository.delete(folder);
    }

    // ---------------------------------------------------------------
    // Top-level trashed folders
    // ---------------------------------------------------------------

    /**
     * Top-level trashed folders only — i.e. folders the user explicitly
     * trashed, excluding ones only trashed as a side effect of an ancestor
     * being trashed.
     *
     * Used by TrashService.emptyTrash() so permanent deletion happens once
     * per subtree instead of redundantly per descendant.
     */
    List<Folder> listTopLevelTrashed(UUID ownerId) {

        List<Folder> trashed =
                folderRepository
                        .findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(
                                ownerId
                        );

        Set<UUID> trashedIds =
                trashed
                        .stream()
                        .map(Folder::getId)
                        .collect(
                                java.util.stream.Collectors.toSet()
                        );

        return trashed
                .stream()
                .filter(
                        f ->
                                f.getParentId() == null
                                        || !trashedIds.contains(
                                                f.getParentId()
                                        )
                )
                .toList();
    }

    // ---------------------------------------------------------------
    // Validation helpers
    // ---------------------------------------------------------------

    private void assertNameAvailable(
            UUID ownerId,
            UUID parentId,
            String name
    ) {

        boolean exists =
                parentId == null
                        ? fileRepository
                                .existsByOwnerIdAndFolderIdIsNullAndNameAndTrashedFalse(
                                        ownerId,
                                        name
                                )
                        : fileRepository
                                .existsByOwnerIdAndFolderIdAndNameAndTrashedFalse(
                                        ownerId,
                                        parentId,
                                        name
                                );

        if (exists) {
            throw new DuplicateNameException(name);
        }
    }

    private void validateMove(
            UUID userId,
            Folder folder,
            UUID targetParentId
    ) {

        if (targetParentId == null) {
            return;
        }

        if (targetParentId.equals(folder.getId())) {
            throw new InvalidFolderMoveException(
                    "A folder cannot be moved into itself"
            );
        }

        // Moving requires at least EDITOR on the destination too.
        permissionService.requireFolderAccess(
                userId,
                targetParentId,
                AccessLevel.EDITOR
        );

        List<UUID> descendantsIncludingSelf =
                folderRepository.findDescendantIdsIncludingSelf(
                        folder.getId()
                );

        if (descendantsIncludingSelf.contains(targetParentId)) {
            throw new InvalidFolderMoveException(
                    "A folder cannot be moved into one of its own subfolders"
            );
        }
    }
}