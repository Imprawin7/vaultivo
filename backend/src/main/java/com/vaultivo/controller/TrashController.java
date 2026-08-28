package com.vaultivo.controller;

import com.vaultivo.dto.TrashResponse;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.TrashService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TrashController {

    private final TrashService trashService;

    @GetMapping("/api/trash")
    public ResponseEntity<TrashResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(trashService.listTrash(principal.getId()));
    }

    /** Irreversible — permanently deletes everything currently in the trash. */
    @DeleteMapping("/api/trash")
    public ResponseEntity<Void> empty(@AuthenticationPrincipal UserPrincipal principal) {
        trashService.emptyTrash(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
