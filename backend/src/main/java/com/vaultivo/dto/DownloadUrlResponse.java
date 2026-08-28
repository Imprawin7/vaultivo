package com.vaultivo.dto;

import java.time.Instant;

public record DownloadUrlResponse(String url, Instant expiresAt) {}
