package com.vaultivo.controller;

import com.vaultivo.dto.ShareCreateRequest;
import com.vaultivo.dto.ShareResponse;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.ShareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @GetMapping("/api/shares/with-me")
    public ResponseEntity<com.vaultivo.dto.SharedWithMeResponse> sharedWithMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(shareService.listSharedWithMe(principal.getId()));
    }

    @PostMapping("/api/files/{fileId}/shares")
    public ResponseEntity<ShareResponse> shareFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId,
            @Valid @RequestBody ShareCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shareService.shareFile(principal.getId(), fileId, request));
    }

    @GetMapping("/api/files/{fileId}/shares")
    public ResponseEntity<List<ShareResponse>> listFileShares(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId) {
        return ResponseEntity.ok(shareService.listFileShares(principal.getId(), fileId));
    }

    @DeleteMapping("/api/files/{fileId}/shares/{shareId}")
    public ResponseEntity<Void> revokeFileShare(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId,
            @PathVariable UUID shareId) {
        shareService.revokeFileShare(principal.getId(), fileId, shareId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/folders/{folderId}/shares")
    public ResponseEntity<ShareResponse> shareFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID folderId,
            @Valid @RequestBody ShareCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shareService.shareFolder(principal.getId(), folderId, request));
    }

    @GetMapping("/api/folders/{folderId}/shares")
    public ResponseEntity<List<ShareResponse>> listFolderShares(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID folderId) {
        return ResponseEntity.ok(shareService.listFolderShares(principal.getId(), folderId));
    }

    @DeleteMapping("/api/folders/{folderId}/shares/{shareId}")
    public ResponseEntity<Void> revokeFolderShare(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID folderId,
            @PathVariable UUID shareId) {
        shareService.revokeFolderShare(principal.getId(), folderId, shareId);
        return ResponseEntity.noContent().build();
    }
}
