package com.vaultivo.controller;

import com.vaultivo.dto.SearchResultResponse;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.FileService;
import com.vaultivo.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SearchController {

    private final FileService fileService;
    private final FolderService folderService;

    @GetMapping("/api/search")
    public ResponseEntity<SearchResultResponse> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("q") String query) {
        var files = fileService.search(principal.getId(), query);
        var folders = folderService.search(principal.getId(), query);
        return ResponseEntity.ok(new SearchResultResponse(files, folders));
    }
}
