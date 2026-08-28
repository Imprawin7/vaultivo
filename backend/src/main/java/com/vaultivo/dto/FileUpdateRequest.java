package com.vaultivo.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Partial update: null fields are left unchanged. To move to root
 * specifically, set moveToRoot = true (same convention as FolderUpdateRequest).
 */
public record FileUpdateRequest(
        @Size(max = 255) String name,
        UUID folderId,
        boolean moveToRoot,
        Boolean starred
) {}
