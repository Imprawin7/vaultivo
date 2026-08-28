package com.vaultivo.repository;

import com.vaultivo.model.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FileRepository extends JpaRepository<File, UUID> {

    Optional<File> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<File> findByOwnerIdAndFolderIdAndTrashedFalseOrderByNameAsc(UUID ownerId, UUID folderId);

    List<File> findByOwnerIdAndFolderIdIsNullAndTrashedFalseOrderByNameAsc(UUID ownerId);

    boolean existsByOwnerIdAndFolderIdAndNameAndTrashedFalse(UUID ownerId, UUID folderId, String name);

    // Same NULL-vs-NULL caveat as folders — see FolderRepository.
    boolean existsByOwnerIdAndFolderIdIsNullAndNameAndTrashedFalse(UUID ownerId, String name);

    List<File> findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(UUID ownerId);

    List<File> findByOwnerIdAndStarredTrueAndTrashedFalseOrderByNameAsc(UUID ownerId);

    // Trigram similarity search on file name (pg_trgm index from schema.sql).
    // Falls back gracefully to substring matching if trigram isn't installed.
    @Query(value = """
            SELECT * FROM files
            WHERE owner_id = :ownerId
              AND is_trashed = FALSE
              AND name ILIKE '%' || :query || '%'
            ORDER BY similarity(name, :query) DESC
            """, nativeQuery = true)
    List<File> searchByName(@Param("ownerId") UUID ownerId, @Param("query") String query);

    List<File> findByFolderIdAndTrashedFalse(UUID folderId);

    List<File> findByFolderIdIn(List<UUID> folderIds);
}
