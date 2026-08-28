package com.vaultivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CompleteUploadRequest(
        @NotBlank String storageKey,   // must match the key returned by init-upload
        @NotBlank String name,
        @NotBlank String mimeType,
        @NotNull @Positive Long sizeBytes,
        UUID folderId,
        String checksumSha256 // optional but recommended for integrity verification
) {}
