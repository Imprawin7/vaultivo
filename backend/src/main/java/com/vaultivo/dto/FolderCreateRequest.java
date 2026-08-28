package com.vaultivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record FolderCreateRequest(
        @NotBlank @Size(max = 255) String name,
        UUID parentId // null = create at root
) {}
