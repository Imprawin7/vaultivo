package com.vaultivo.dto;

import com.vaultivo.model.UploadAttempt;

import java.time.Instant;
import java.util.UUID;

public record FailedUploadResponse(
        UUID id,
        String ownerEmail,
        String name,
        long sizeBytes,
        Instant createdAt
) {
    public static FailedUploadResponse from(UploadAttempt attempt, String ownerEmail) {
        return new FailedUploadResponse(
                attempt.getId(), ownerEmail, attempt.getName(), attempt.getSizeBytes(), attempt.getCreatedAt());
    }
}
