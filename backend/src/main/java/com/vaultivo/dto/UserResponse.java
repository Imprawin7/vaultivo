package com.vaultivo.dto;

import com.vaultivo.model.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        String avatarUrl,
        long storageQuotaBytes,
        long storageUsedBytes
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getStorageQuotaBytes(),
                user.getStorageUsedBytes()
        );
    }
}
