package com.vaultivo.controller;

import com.vaultivo.dto.AdminUserResponse;
import com.vaultivo.dto.AdminUserUpdateRequest;
import com.vaultivo.dto.PlatformStatsResponse;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Every endpoint here requires ROLE_ADMIN — enforced in SecurityConfig
 * (.requestMatchers("/api/admin/**").hasRole("ADMIN")), not per-method here.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsResponse> stats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> updateUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody AdminUserUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateUser(principal.getId(), id, request));
    }
}