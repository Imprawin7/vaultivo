package com.vaultivo.repository;

import com.vaultivo.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FolderRepository extends JpaRepository<Folder, UUID> {

    Optional<Folder> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<Folder> findByOwnerIdAndParentIdAndTrashedFalseOrderByNameAsc(UUID ownerId, UUID parentId);

    List<Folder> findByOwnerIdAndParentIdIsNullAndTrashedFalseOrderByNameAsc(UUID ownerId);

    List<Folder> findByOwnerIdAndTrashedTrueOrderByTrashedAtDesc(UUID ownerId);

    @Query(value = """
            SELECT * FROM folders
            WHERE owner_id = :ownerId AND is_trashed = FALSE
              AND name ILIKE '%' || :query || '%'
            ORDER BY name ASC
            """, nativeQuery = true)
    List<Folder> searchByName(@Param("ownerId") UUID ownerId, @Param("query") String query);

    boolean existsByOwnerIdAndParentIdAndNameAndTrashedFalse(UUID ownerId, UUID parentId, String name);

    // The DB's UNIQUE(owner_id, parent_id, name) constraint does NOT catch
    // duplicate root-level names, because Postgres treats NULL <> NULL —
    // two rows with parent_id = NULL never collide on that constraint.
    // This app-level check is what actually enforces root-folder uniqueness.
    boolean existsByOwnerIdAndParentIdIsNullAndNameAndTrashedFalse(UUID ownerId, String name);

    /**
     * All descendant folder IDs of {@code folderId}, INCLUDING itself.
     * Used both for cascading trash and for the move-cycle check below.
     */
    @Query(value = """
            WITH RECURSIVE folder_tree AS (
                SELECT id FROM folders WHERE id = :folderId
                UNION ALL
                SELECT f.id FROM folders f
                INNER JOIN folder_tree ft ON f.parent_id = ft.id
            )
            SELECT id FROM folder_tree
            """, nativeQuery = true)
    List<UUID> findDescendantIdsIncludingSelf(@Param("folderId") UUID folderId);

    /**
     * Breadcrumb from {@code folderId} up to the root, ordered nearest-root first.
     */
    @Query(value = """
            WITH RECURSIVE breadcrumb AS (
                SELECT id, parent_id, name, 0 AS depth
                FROM folders WHERE id = :folderId
                UNION ALL
                SELECT f.id, f.parent_id, f.name, b.depth + 1
                FROM folders f
                INNER JOIN breadcrumb b ON f.id = b.parent_id
            )
            SELECT id FROM breadcrumb ORDER BY depth DESC
            """, nativeQuery = true)
    List<UUID> findBreadcrumbIds(@Param("folderId") UUID folderId);

    @Modifying
    @Query(value = """
            WITH RECURSIVE folder_tree AS (
                SELECT id FROM folders WHERE id = :folderId
                UNION ALL
                SELECT f.id FROM folders f
                INNER JOIN folder_tree ft ON f.parent_id = ft.id
            )
            UPDATE folders SET is_trashed = TRUE, trashed_at = :trashedAt
            WHERE id IN (SELECT id FROM folder_tree)
            """, nativeQuery = true)
    void trashSubtree(@Param("folderId") UUID folderId, @Param("trashedAt") Instant trashedAt);

    @Modifying
    @Query(value = """
            WITH RECURSIVE folder_tree AS (
                SELECT id FROM folders WHERE id = :folderId
                UNION ALL
                SELECT f.id FROM folders f
                INNER JOIN folder_tree ft ON f.parent_id = ft.id
            )
            UPDATE files SET is_trashed = TRUE, trashed_at = :trashedAt
            WHERE folder_id IN (SELECT id FROM folder_tree)
            """, nativeQuery = true)
    void trashFilesInSubtree(@Param("folderId") UUID folderId, @Param("trashedAt") Instant trashedAt);
}
