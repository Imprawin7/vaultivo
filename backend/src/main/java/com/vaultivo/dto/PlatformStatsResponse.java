package com.vaultivo.dto;

public record PlatformStatsResponse(
        long totalUsers,
        long activeUsers,
        long totalFiles,
        long totalFolders,
        long totalStorageUsedBytes
) {}