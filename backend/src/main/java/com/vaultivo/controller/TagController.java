package com.vaultivo.controller;

import com.vaultivo.dto.*;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.TagService;
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
public class TagController {

    private final TagService tagService;

    @PostMapping("/api/tags")
    public ResponseEntity<TagResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TagCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(principal.getId(), request));
    }

    @GetMapping("/api/tags")
    public ResponseEntity<List<TagResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(tagService.listTags(principal.getId()));
    }

    @DeleteMapping("/api/tags/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        tagService.deleteTag(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/tags/{id}/items")
    public ResponseEntity<TaggedItemsResponse> items(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(tagService.itemsByTag(principal.getId(), id));
    }

    @PostMapping("/api/tags/{tagId}/files/{fileId}")
    public ResponseEntity<Void> assignToFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID tagId,
            @PathVariable UUID fileId) {
        tagService.assignToFile(principal.getId(), tagId, fileId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/tags/{tagId}/files/{fileId}")
    public ResponseEntity<Void> removeFromFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID tagId,
            @PathVariable UUID fileId) {
        tagService.removeFromFile(principal.getId(), tagId, fileId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/tags/{tagId}/folders/{folderId}")
    public ResponseEntity<Void> assignToFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID tagId,
            @PathVariable UUID folderId) {
        tagService.assignToFolder(principal.getId(), tagId, folderId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/tags/{tagId}/folders/{folderId}")
    public ResponseEntity<Void> removeFromFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID tagId,
            @PathVariable UUID folderId) {
        tagService.removeFromFolder(principal.getId(), tagId, folderId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/files/{fileId}/tags")
    public ResponseEntity<List<TagResponse>> tagsForFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID fileId) {
        return ResponseEntity.ok(tagService.tagsForFile(principal.getId(), fileId));
    }

    @GetMapping("/api/folders/{folderId}/tags")
    public ResponseEntity<List<TagResponse>> tagsForFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID folderId) {
        return ResponseEntity.ok(tagService.tagsForFolder(principal.getId(), folderId));
    }
}
