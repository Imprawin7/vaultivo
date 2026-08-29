package com.vaultivo.dto;

/**
 * Partial update — null fields are left unchanged. storageQuotaBytes lets
 * an admin grant/restrict a user's quota; active toggles suspend/reactivate.
 */
public record AdminUserUpdateRequest(
        Boolean active,
        Long storageQuotaBytes
) {}