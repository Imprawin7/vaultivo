package com.vaultivo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PlanCreateRequest(
        @NotBlank String name,
        @NotNull @Positive Long quotaBytes,
        @Min(0) Integer priceCents
) {}
