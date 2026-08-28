package com.vaultivo.dto;

import java.time.Instant;

public record InitUploadResponse(
        String storageKey,
        String uploadUrl,
        Instant expiresAt
) {}
