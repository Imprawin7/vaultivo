package com.vaultivo.dto;

import com.vaultivo.model.Plan;

import java.util.UUID;

public record PlanResponse(
        UUID id,
        String name,
        long quotaBytes,
        int priceCents
) {
    public static PlanResponse from(Plan plan) {
        return new PlanResponse(plan.getId(), plan.getName(), plan.getQuotaBytes(), plan.getPriceCents());
    }
}
