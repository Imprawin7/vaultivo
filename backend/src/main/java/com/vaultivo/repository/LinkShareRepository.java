package com.vaultivo.repository;

import com.vaultivo.model.LinkShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LinkShareRepository extends JpaRepository<LinkShare, UUID> {

    Optional<LinkShare> findByToken(String token);

    List<LinkShare> findByFileId(UUID fileId);

    List<LinkShare> findByFolderId(UUID folderId);
}
