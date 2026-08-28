package com.vaultivo.dto;

import com.vaultivo.model.Share;
import com.vaultivo.model.ShareRole;

import java.time.Instant;
import java.util.UUID;

public record ShareResponse(
        UUID id,
        UUID fileId,
        UUID folderId,
        UUID sharedWithId,
        String sharedWithEmail,
        ShareRole role,
        Instant createdAt
) {
    public static ShareResponse from(Share share, String sharedWithEmail) {
        return new ShareResponse(
                share.getId(), share.getFileId(), share.getFolderId(),
                share.getSharedWithId(), sharedWithEmail, share.getRole(), share.getCreatedAt());
    }
}
