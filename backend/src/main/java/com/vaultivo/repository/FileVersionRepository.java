package com.vaultivo.repository;

import com.vaultivo.model.FileVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FileVersionRepository extends JpaRepository<FileVersion, UUID> {

    List<FileVersion> findByFileIdOrderByVersionNumberDesc(UUID fileId);

    List<FileVersion> findByFileId(UUID fileId); // used for bulk S3 cleanup on permanent delete, order doesn't matter
}
