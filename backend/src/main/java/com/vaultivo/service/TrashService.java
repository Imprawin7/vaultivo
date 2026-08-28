package com.vaultivo.service;

import com.vaultivo.dto.TrashResponse;
import com.vaultivo.model.Folder;
import com.vaultivo.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrashService {

    private final FileService fileService;
    private final FolderService folderService;
    private final FileRepository fileRepository;

    public TrashResponse listTrash(UUID ownerId) {
        return new TrashResponse(fileService.listTrashed(ownerId), folderService.listTrashed(ownerId));
    }

    /**
     * Permanently deletes everything currently in the trash. Only calls
     * permanentlyDeleteFolder on TOP-LEVEL trashed folders (see
     * FolderService.listTopLevelTrashed) — each call cascades through its
     * entire subtree at the DB level, so calling it again for an already-
     * cascaded-away descendant would just 404.
     *
     * Files are then permanently deleted individually, but only the ones
     * NOT already covered by a folder cascade above. Since trashing a
     * folder marks its whole subtree as trashed (see FolderService.
     * trashFolder), the full set of trashed folder ids IS exactly the set
     * of folders being removed via the top-level cascades — so filtering
     * against ALL trashed folder ids (not just the top-level ones) is what
     * correctly excludes files nested several levels deep.
     */
    @Transactional
    public void emptyTrash(UUID ownerId) {
        var topLevelTrashedFolders = folderService.listTopLevelTrashed(ownerId);

        var allTrashedFolderIds = folderService.listTrashed(ownerId).stream()
                .map(com.vaultivo.dto.FolderResponse::id)
                .collect(java.util.stream.Collectors.toSet());

        for (Folder folder : topLevelTrashedFolders) {
            folderService.permanentlyDeleteFolder(ownerId, folder.getId());
        }

        fileRepository.findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(ownerId).stream()
                .filter(f -> f.getFolderId() == null || !allTrashedFolderIds.contains(f.getFolderId()))
                .forEach(f -> fileService.permanentlyDeleteFile(ownerId, f.getId()));
    }
}
