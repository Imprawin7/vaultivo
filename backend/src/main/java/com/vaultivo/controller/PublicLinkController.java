package com.vaultivo.controller;

import com.vaultivo.dto.DownloadUrlResponse;
import com.vaultivo.dto.PublicLinkAccessRequest;
import com.vaultivo.dto.PublicLinkInfoResponse;
import com.vaultivo.service.LinkShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Deliberately unauthenticated — see SecurityConfig, /api/public-links/** is
 * permitAll(). Access control here comes entirely from the link's own token
 * and optional password, not from Spring Security's session/JWT layer.
 */
@RestController
@RequestMapping("/api/public-links")
@RequiredArgsConstructor
public class PublicLinkController {

    private final LinkShareService linkShareService;

    /**
     * GET with an optional password as a query param covers the common case
     * (no password) with a plain link click. For password-protected links
     * the frontend calls this first without a password to learn
     * requiresPassword=true, then again with ?password=... once the user
     * types it in.
     */
    @GetMapping("/{token}")
    public ResponseEntity<PublicLinkInfoResponse> info(
            @PathVariable String token,
            @RequestParam(required = false) String password) {
        return ResponseEntity.ok(linkShareService.getPublicInfo(token, password));
    }

    @PostMapping("/{token}/download-url")
    public ResponseEntity<DownloadUrlResponse> downloadUrl(
            @PathVariable String token,
            @RequestBody(required = false) PublicLinkAccessRequest request) {
        String password = request != null ? request.password() : null;
        return ResponseEntity.ok(linkShareService.getPublicDownloadUrl(token, password));
    }

    /** Downloads one file from within a publicly-shared FOLDER link (not a link that points directly at a file). */
    @PostMapping("/{token}/files/{fileId}/download-url")
    public ResponseEntity<DownloadUrlResponse> folderFileDownloadUrl(
            @PathVariable String token,
            @PathVariable java.util.UUID fileId,
            @RequestBody(required = false) PublicLinkAccessRequest request) {
        String password = request != null ? request.password() : null;
        return ResponseEntity.ok(linkShareService.getPublicFolderFileDownloadUrl(token, fileId, password));
    }

    @PostMapping("/{token}/preview-url")
    public ResponseEntity<DownloadUrlResponse> previewUrl(
            @PathVariable String token,
            @RequestBody(required = false) PublicLinkAccessRequest request) {
        String password = request != null ? request.password() : null;
        return ResponseEntity.ok(linkShareService.getPublicPreviewUrl(token, password));
    }

    @PostMapping("/{token}/files/{fileId}/preview-url")
    public ResponseEntity<DownloadUrlResponse> folderFilePreviewUrl(
            @PathVariable String token,
            @PathVariable java.util.UUID fileId,
            @RequestBody(required = false) PublicLinkAccessRequest request) {
        String password = request != null ? request.password() : null;
        return ResponseEntity.ok(linkShareService.getPublicFolderFilePreviewUrl(token, fileId, password));
    }
}
