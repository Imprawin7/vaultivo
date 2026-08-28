package com.vaultivo.dto;

import com.vaultivo.model.ShareRole;
import jakarta.validation.constraints.NotNull;

public record LinkShareCreateRequest(
        @NotNull ShareRole role,
        String password,          // null/blank = no password
        Integer expiresInHours    // null = never expires
) {}
