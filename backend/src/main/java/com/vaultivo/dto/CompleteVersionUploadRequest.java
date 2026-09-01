package com.vaultivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CompleteVersionUploadRequest(
        @NotBlank String storageKey,
        @NotBlank String mimeType,
        @NotNull @Positive Long sizeBytes,
        String checksumSha256
) {}
