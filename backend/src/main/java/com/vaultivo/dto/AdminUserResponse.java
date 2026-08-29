package com.vaultivo.dto;

import com.vaultivo.model.User;

import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String displayName,
        String authProvider,
        boolean active,
        boolean admin,
        long storageQuotaBytes,
        long storageUsedBytes,
        Instant createdAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(), user.getEmail(), user.getDisplayName(),
                user.getAuthProvider().name(), user.isActive(), user.isAdmin(),
                user.getStorageQuotaBytes(), user.getStorageUsedBytes(), user.getCreatedAt());
    }
}