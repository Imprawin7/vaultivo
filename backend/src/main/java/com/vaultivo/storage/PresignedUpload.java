package com.vaultivo.storage;

import java.time.Instant;

public record PresignedUpload(String storageKey, String uploadUrl, Instant expiresAt) {}
