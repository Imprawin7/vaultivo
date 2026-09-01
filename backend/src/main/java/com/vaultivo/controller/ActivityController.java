package com.vaultivo.controller;

import com.vaultivo.dto.ActivityResponse;
import com.vaultivo.activity.ActivityLogService;
import com.vaultivo.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Any authenticated user can see their OWN activity here — distinct from
 * AdminController's platform-wide /api/admin/activity, which requires
 * ROLE_ADMIN and shows every user's actions.
 */
@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityLogService activityLogService;

    @GetMapping("/api/activity")
    public ResponseEntity<List<ActivityResponse>> myActivity(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "50") int limit) {
        String ownEmail = principal.getUser().getEmail(); // always the caller's own email in this context
        List<ActivityResponse> response = activityLogService.listForUser(principal.getId(), limit).stream()
                .map(a -> ActivityResponse.from(a, ownEmail))
                .toList();
        return ResponseEntity.ok(response);
    }
}
