package com.vaultivo.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Partial update: null name = don't rename. To move, set parentId to the
 * target folder. To move to root specifically, set moveToRoot = true
 * (parentId is otherwise indistinguishable from "no move requested").
 */
public record FolderUpdateRequest(
        @Size(max = 255) String name,
        UUID parentId,
        boolean moveToRoot
) {}
