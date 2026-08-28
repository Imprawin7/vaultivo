package com.vaultivo.controller;

import com.vaultivo.dto.LinkShareCreateRequest;
import com.vaultivo.dto.LinkShareResponse;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.LinkShareService;
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
public class LinkShareController {

    private final LinkShareService linkShareService;

    @PostMapping("/api/files/{fileId}/link-shares")
    public ResponseEntity<LinkShareResponse> createForFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId,
            @Valid @RequestBody LinkShareCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(linkShareService.createForFile(principal.getId(), fileId, request));
    }

    @GetMapping("/api/files/{fileId}/link-shares")
    public ResponseEntity<List<LinkShareResponse>> listForFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId) {
        return ResponseEntity.ok(linkShareService.listForFile(principal.getId(), fileId));
    }

    @PostMapping("/api/folders/{folderId}/link-shares")
    public ResponseEntity<LinkShareResponse> createForFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID folderId,
            @Valid @RequestBody LinkShareCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(linkShareService.createForFolder(principal.getId(), folderId, request));
    }

    @GetMapping("/api/folders/{folderId}/link-shares")
    public ResponseEntity<List<LinkShareResponse>> listForFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID folderId) {
        return ResponseEntity.ok(linkShareService.listForFolder(principal.getId(), folderId));
    }

    @DeleteMapping("/api/link-shares/{linkShareId}")
    public ResponseEntity<Void> revoke(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID linkShareId) {
        linkShareService.revoke(principal.getId(), linkShareId);
        return ResponseEntity.noContent().build();
    }
}
