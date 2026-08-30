package com.vaultivo.activity;

import com.vaultivo.model.Activity;
import com.vaultivo.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Thin write-only wrapper around ActivityRepository. Logging failures are
 * swallowed deliberately (best-effort audit trail, not a transactional
 * guarantee) — a logging hiccup should never block the actual action it's
 * describing (a login, a suspension, etc.).
 */
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityRepository activityRepository;

    public void log(UUID actorId, String action) {
        log(actorId, action, null, null, null);
    }

    public void log(UUID actorId, String action, Map<String, Object> metadata) {
        log(actorId, action, null, null, metadata);
    }

    public void log(UUID actorId, String action, UUID fileId, UUID folderId, Map<String, Object> metadata) {
        try {
            activityRepository.save(Activity.builder()
                    .actorId(actorId)
                    .action(action)
                    .fileId(fileId)
                    .folderId(folderId)
                    .metadata(metadata)
                    .build());
        } catch (RuntimeException ignored) {
            // Best-effort — never let audit logging break the real request.
        }
    }
}
