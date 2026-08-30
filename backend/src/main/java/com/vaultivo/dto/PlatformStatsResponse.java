package com.vaultivo.dto;

public record PlatformStatsResponse(
        long totalUsers,
        long activeUsers,
        long suspendedUsers,
        long totalFiles,
        long totalFolders,
        long totalStorageUsedBytes,
        long totalStorageAllocatedBytes
) {}
