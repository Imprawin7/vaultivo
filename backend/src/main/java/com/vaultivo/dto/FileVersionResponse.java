package com.vaultivo.dto;

import com.vaultivo.model.FileVersion;

import java.time.Instant;
import java.util.UUID;

public record FileVersionResponse(
        UUID id,
        int versionNumber,
        long sizeBytes,
        String uploadedByEmail,
        Instant createdAt
) {
    public static FileVersionResponse from(FileVersion version, String uploadedByEmail) {
        return new FileVersionResponse(
                version.getId(), version.getVersionNumber(), version.getSizeBytes(),
                uploadedByEmail, version.getCreatedAt());
    }
}
