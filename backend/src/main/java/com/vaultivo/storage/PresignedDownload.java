package com.vaultivo.storage;

import java.time.Instant;

public record PresignedDownload(String downloadUrl, Instant expiresAt) {}
