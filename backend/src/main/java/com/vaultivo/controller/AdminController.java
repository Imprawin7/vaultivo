package com.vaultivo.controller;

import com.vaultivo.dto.*;
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

    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsResponse> stats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> listUsers(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(adminService.listUsers(q));
    }

    @GetMapping("/users/top-storage")
    public ResponseEntity<List<AdminUserResponse>> topStorageUsers(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminService.topStorageUsers(limit));
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> updateUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody AdminUserUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateUser(principal.getId(), id, request));
    }

    /** Irreversible — deletes the account, every file's S3 object, and cascades the rest at the DB level. */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        adminService.deleteUserAccount(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityResponse>> recentActivity(
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(adminService.recentActivity(limit));
    }

    @GetMapping("/uploads/failed")
    public ResponseEntity<List<FailedUploadResponse>> failedUploads() {
        return ResponseEntity.ok(adminService.failedUploads());
    }
}
