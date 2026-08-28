package com.vaultivo.controller;

import com.vaultivo.dto.*;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/init-upload")
    public ResponseEntity<InitUploadResponse> initUpload(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody InitUploadRequest request) {
        return ResponseEntity.ok(fileService.initUpload(principal.getId(), request));
    }

    @PostMapping("/complete-upload")
    public ResponseEntity<FileResponse> completeUpload(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fileService.completeUpload(principal.getId(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(fileService.getFile(principal.getId(), id));
    }

    @GetMapping("/starred")
    public ResponseEntity<java.util.List<FileResponse>> starred(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fileService.listStarred(principal.getId()));
    }

    @GetMapping("/{id}/download-url")
    public ResponseEntity<DownloadUrlResponse> downloadUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(fileService.getDownloadUrl(principal.getId(), id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FileResponse> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody FileUpdateRequest request) {
        return ResponseEntity.ok(fileService.updateFile(principal.getId(), id, request));
    }

    /** Soft-delete: moves the file to Trash. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> trash(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        fileService.trashFile(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<FileResponse> restore(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(fileService.restoreFile(principal.getId(), id));
    }

    /** Irreversible — permanently deletes the S3 object and DB row. */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentDelete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        fileService.permanentlyDeleteFile(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
