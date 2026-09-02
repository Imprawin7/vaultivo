package com.vaultivo.dto;

import com.vaultivo.model.Tag;

import java.time.Instant;
import java.util.UUID;

public record TagResponse(
        UUID id,
        String name,
        String color,
        Instant createdAt
) {
    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getColor(), tag.getCreatedAt());
    }
}
