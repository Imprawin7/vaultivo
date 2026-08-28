package com.vaultivo.dto;

import com.vaultivo.model.Folder;

import java.time.Instant;
import java.util.UUID;

public record FolderResponse(
        UUID id,
        String name,
        UUID parentId,
        Instant createdAt,
        Instant updatedAt
) {
    public static FolderResponse from(Folder folder) {
        return new FolderResponse(
                folder.getId(), folder.getName(), folder.getParentId(),
                folder.getCreatedAt(), folder.getUpdatedAt());
    }
}
