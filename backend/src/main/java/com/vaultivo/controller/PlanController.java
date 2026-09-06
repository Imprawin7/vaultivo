package com.vaultivo.controller;

import com.vaultivo.dto.PlanCreateRequest;
import com.vaultivo.dto.PlanResponse;
import com.vaultivo.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    /** Any authenticated user can see what plans exist — e.g. for an upgrade page. */
    @GetMapping
    public ResponseEntity<List<PlanResponse>> list() {
        return ResponseEntity.ok(planService.listPlans());
    }

    /**
     * Admin-only despite living outside /api/admin/** — kept here so the
     * "list plans" and "create plan" endpoints for the same resource stay
     * together. Protected explicitly in SecurityConfig since the path
     * itself doesn't match the /api/admin/** pattern.
     */
    @PostMapping
    public ResponseEntity<PlanResponse> create(@Valid @RequestBody PlanCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.createPlan(request));
    }
}
