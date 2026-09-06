package com.vaultivo.service;

import com.vaultivo.dto.PlanCreateRequest;
import com.vaultivo.dto.PlanResponse;
import com.vaultivo.exception.DuplicateNameException;
import com.vaultivo.model.Plan;
import com.vaultivo.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Plans are immutable once created (no update/delete) — editing a tier's
 * quota retroactively, or deleting one users are actively on, opens
 * questions (do existing subscribers change too?) that are a billing-system
 * concern beyond this MVP's scope. Admins can always add new tiers.
 */
@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;

    public List<PlanResponse> listPlans() {
        return planRepository.findAllByOrderByQuotaBytesAsc().stream().map(PlanResponse::from).toList();
    }

    @Transactional
    public PlanResponse createPlan(PlanCreateRequest request) {
        if (planRepository.existsByName(request.name())) {
            throw new DuplicateNameException(request.name());
        }
        Plan plan = Plan.builder()
                .name(request.name())
                .quotaBytes(request.quotaBytes())
                .priceCents(request.priceCents() != null ? request.priceCents() : 0)
                .build();
        return PlanResponse.from(planRepository.save(plan));
    }
}
