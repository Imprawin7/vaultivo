package com.vaultivo.repository;

import com.vaultivo.model.UploadAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UploadAttemptRepository extends JpaRepository<UploadAttempt, UUID> {

    Optional<UploadAttempt> findByStorageKey(String storageKey);

    // "Failed" isn't a distinct status we can detect at write time — it's
    // inferred as: still PENDING well after the presigned URL would have
    // expired, since a genuinely completed upload updates its status.
    List<UploadAttempt> findByStatusAndCreatedAtBeforeOrderByCreatedAtDesc(
            UploadAttempt.Status status, Instant threshold);
}
