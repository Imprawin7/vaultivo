package com.vaultivo.dto;

import com.vaultivo.model.File;

import java.time.Instant;
import java.util.UUID;

public record FileResponse(
        UUID id,
        String name,
        String mimeType,
        long sizeBytes,
        UUID folderId,
        boolean starred,
        int currentVersion,
        Instant createdAt,
        Instant updatedAt
) {
    public static FileResponse from(File file) {
        return new FileResponse(
                file.getId(), file.getName(), file.getMimeType(), file.getSizeBytes(),
                file.getFolderId(), file.isStarred(), file.getCurrentVersion(),
                file.getCreatedAt(), file.getUpdatedAt());
    }
}
