package com.vaultivo.repository;

import com.vaultivo.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShareRepository extends JpaRepository<Share, UUID> {

    Optional<Share> findByFileIdAndSharedWithId(UUID fileId, UUID sharedWithId);

    Optional<Share> findByFolderIdAndSharedWithId(UUID folderId, UUID sharedWithId);

    // Used by PermissionService to check a user's access across an entire
    // folder ancestor chain in one query.
    List<Share> findByFolderIdInAndSharedWithId(List<UUID> folderIds, UUID sharedWithId);

    List<Share> findByFileId(UUID fileId);

    List<Share> findByFolderId(UUID folderId);

    List<Share> findBySharedWithId(UUID sharedWithId);

    Optional<Share> findByIdAndFileId(UUID id, UUID fileId);

    Optional<Share> findByIdAndFolderId(UUID id, UUID folderId);
}
