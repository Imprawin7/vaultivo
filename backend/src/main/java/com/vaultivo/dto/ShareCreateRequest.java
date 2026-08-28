package com.vaultivo.dto;

import com.vaultivo.model.ShareRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ShareCreateRequest(
        @NotBlank @Email String email, // person to share with, looked up by email
        @NotNull ShareRole role
) {}
