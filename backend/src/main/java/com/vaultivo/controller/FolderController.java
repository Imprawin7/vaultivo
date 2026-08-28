package com.vaultivo.controller;

import com.vaultivo.dto.*;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping
    public ResponseEntity<FolderResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FolderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(folderService.createFolder(principal.getId(), request));
    }

    /** Root-level listing — "My Drive" home view. */
    @GetMapping("/root")
    public ResponseEntity<FolderDetailResponse> root(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(folderService.getRootDetail(principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FolderDetailResponse> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(folderService.getFolderDetail(principal.getId(), id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FolderResponse> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody FolderUpdateRequest request) {
        return ResponseEntity.ok(folderService.updateFolder(principal.getId(), id, request));
    }

    /** Soft-delete: trashes this folder and everything inside it. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> trash(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        folderService.trashFolder(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<FolderResponse> restore(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(folderService.restoreFolder(principal.getId(), id));
    }

    /** Irreversible — deletes every S3 object in the subtree and refunds quota. */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentDelete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        folderService.permanentlyDeleteFolder(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
