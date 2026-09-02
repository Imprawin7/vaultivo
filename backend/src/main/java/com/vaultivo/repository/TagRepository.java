package com.vaultivo.repository;

import com.vaultivo.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findByOwnerIdOrderByNameAsc(UUID ownerId);

    Optional<Tag> findByIdAndOwnerId(UUID id, UUID ownerId);

    boolean existsByOwnerIdAndName(UUID ownerId, String name);
}
