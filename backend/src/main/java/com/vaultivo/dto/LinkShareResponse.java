package com.vaultivo.dto;

import com.vaultivo.model.LinkShare;
import com.vaultivo.model.ShareRole;

import java.time.Instant;
import java.util.UUID;

public record LinkShareResponse(
        UUID id,
        String token,
        ShareRole role,
        boolean hasPassword,
        Instant expiresAt,
        Instant createdAt
) {
    public static LinkShareResponse from(LinkShare link) {
        return new LinkShareResponse(
                link.getId(), link.getToken(), link.getRole(),
                link.getPasswordHash() != null, link.getExpiresAt(), link.getCreatedAt());
    }
}
