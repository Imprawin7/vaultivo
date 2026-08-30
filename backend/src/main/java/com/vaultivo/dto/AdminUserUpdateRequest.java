package com.vaultivo.dto;

/**
 * Partial update — null fields are left unchanged. active toggles
 * suspend/reactivate, storageQuotaBytes grants/restricts quota, admin
 * promotes/demotes platform-admin status (self-demotion is blocked
 * server-side, same reasoning as self-suspension).
 */
public record AdminUserUpdateRequest(
        Boolean active,
        Long storageQuotaBytes,
        Boolean admin
) {}
