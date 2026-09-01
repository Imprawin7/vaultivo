package com.vaultivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Replaces a file's content — name/folder are unchanged, only the bytes are. */
public record InitVersionUploadRequest(
        @NotBlank String mimeType,
        @NotNull @Positive Long sizeBytes
) {}
