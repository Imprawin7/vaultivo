package com.vaultivo.dto;

import com.vaultivo.model.Activity;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        UUID actorId,
        String actorEmail,
        String action,
        UUID fileId,
        UUID folderId,
        Map<String, Object> metadata,
        Instant createdAt
) {
    public static ActivityResponse from(Activity activity, String actorEmail) {
        return new ActivityResponse(
                activity.getId(), activity.getActorId(), actorEmail, activity.getAction(),
                activity.getFileId(), activity.getFolderId(), activity.getMetadata(), activity.getCreatedAt());
    }
}
