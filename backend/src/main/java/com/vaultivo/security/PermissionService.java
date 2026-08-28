package com.vaultivo.security;

import com.vaultivo.exception.ForbiddenException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.File;
import com.vaultivo.model.Folder;
import com.vaultivo.model.Share;
import com.vaultivo.model.ShareRole;
import com.vaultivo.repository.FileRepository;
import com.vaultivo.repository.FolderRepository;
import com.vaultivo.repository.ShareRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Central authorization point for files and folders. Access can come from:
 *   1. Direct ownership (fastest path, checked first)
 *   2. A direct share on the resource itself
 *   3. A share on any ancestor folder (permission inheritance — sharing a
 *      folder implicitly grants the same role to everything inside it)
 *
 * When multiple applicable shares exist (e.g. a Viewer share on the file
 * itself but an Editor share on its parent folder), the HIGHEST role wins.
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;
    private final ShareRepository shareRepository;

    public AccessLevel resolveFileAccess(UUID userId, File file) {
        if (file.getOwnerId().equals(userId)) {
            return AccessLevel.OWNER;
        }

        AccessLevel best = AccessLevel.NONE;

        var direct = shareRepository.findByFileIdAndSharedWithId(file.getId(), userId);
        if (direct.isPresent()) {
            best = max(best, toAccessLevel(direct.get().getRole()));
        }

        if (file.getFolderId() != null) {
            best = max(best, resolveFolderAccess(userId, file.getFolderId()));
        }

        return best;
    }

    public AccessLevel resolveFolderAccess(UUID userId, UUID folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + folderId));

        if (folder.getOwnerId().equals(userId)) {
            return AccessLevel.OWNER;
        }

        // Ancestor chain including this folder itself — findBreadcrumbIds
        // walks parent_id up to root via the recursive CTE from Step 4.
        List<UUID> ancestorIds = folderRepository.findBreadcrumbIds(folderId);

        AccessLevel best = AccessLevel.NONE;
        for (Share share : shareRepository.findByFolderIdInAndSharedWithId(ancestorIds, userId)) {
            best = max(best, toAccessLevel(share.getRole()));
        }
        return best;
    }

    /** Loads the file and enforces the required access level in one call. */
    public File requireFileAccess(UUID userId, UUID fileId, AccessLevel required) {
        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        AccessLevel level = resolveFileAccess(userId, file);
        if (level == AccessLevel.NONE) {
            // No access at all — behave as if the resource doesn't exist,
            // rather than confirming its existence to an unauthorized caller.
            throw new ResourceNotFoundException("File not found: " + fileId);
        }
        if (!level.atLeast(required)) {
            throw new ForbiddenException("You have " + level + " access; " + required + " is required");
        }
        return file;
    }

    public Folder requireFolderAccess(UUID userId, UUID folderId, AccessLevel required) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + folderId));

        AccessLevel level = resolveFolderAccess(userId, folderId);
        if (level == AccessLevel.NONE) {
            throw new ResourceNotFoundException("Folder not found: " + folderId);
        }
        if (!level.atLeast(required)) {
            throw new ForbiddenException("You have " + level + " access; " + required + " is required");
        }
        return folder;
    }

    private AccessLevel toAccessLevel(ShareRole role) {
        return switch (role) {
            case VIEWER -> AccessLevel.VIEWER;
            case EDITOR -> AccessLevel.EDITOR;
        };
    }

    private AccessLevel max(AccessLevel a, AccessLevel b) {
        return a.ordinal() >= b.ordinal() ? a : b;
    }
}
