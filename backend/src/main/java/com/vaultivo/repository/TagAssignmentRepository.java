package com.vaultivo.repository;

import com.vaultivo.model.TagAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TagAssignmentRepository extends JpaRepository<TagAssignment, UUID> {

    List<TagAssignment> findByFileId(UUID fileId);

    List<TagAssignment> findByFolderId(UUID folderId);

    List<TagAssignment> findByTagId(UUID tagId);

    Optional<TagAssignment> findByTagIdAndFileId(UUID tagId, UUID fileId);

    Optional<TagAssignment> findByTagIdAndFolderId(UUID tagId, UUID folderId);

    boolean existsByTagIdAndFileId(UUID tagId, UUID fileId);

    boolean existsByTagIdAndFolderId(UUID tagId, UUID folderId);
}
