package com.vaultivo.controller;

import com.vaultivo.dto.*;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.FileVersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files/{fileId}/versions")
@RequiredArgsConstructor
public class FileVersionController {

    private final FileVersionService fileVersionService;

    @PostMapping("/init-upload")
    public ResponseEntity<InitUploadResponse> initUpload(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId,
            @Valid @RequestBody InitVersionUploadRequest request) {
        return ResponseEntity.ok(fileVersionService.initVersionUpload(principal.getId(), fileId, request));
    }

    @PostMapping("/complete-upload")
    public ResponseEntity<FileResponse> completeUpload(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId,
            @Valid @RequestBody CompleteVersionUploadRequest request) {
        return ResponseEntity.ok(fileVersionService.completeVersionUpload(principal.getId(), fileId, request));
    }

    @GetMapping
    public ResponseEntity<List<FileVersionResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId) {
        return ResponseEntity.ok(fileVersionService.listVersions(principal.getId(), fileId));
    }

    @GetMapping("/{versionId}/download-url")
    public ResponseEntity<DownloadUrlResponse> downloadUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId,
            @PathVariable UUID versionId) {
        return ResponseEntity.ok(fileVersionService.getVersionDownloadUrl(principal.getId(), fileId, versionId));
    }

    @PostMapping("/{versionId}/restore")
    public ResponseEntity<FileResponse> restore(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId,
            @PathVariable UUID versionId) {
        return ResponseEntity.ok(fileVersionService.restoreVersion(principal.getId(), fileId, versionId));
    }
}
