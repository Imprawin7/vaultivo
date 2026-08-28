package com.vaultivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record InitUploadRequest(
        @NotBlank String name,
        @NotBlank String mimeType,
        @NotNull @Positive Long sizeBytes,
        UUID folderId // null = root
) {}
