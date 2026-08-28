package com.vaultivo.dto;

import com.vaultivo.model.ShareRole;

import java.util.List;

/**
 * What an anonymous visitor sees at a public link — deliberately excludes
 * owner identity and internal IDs beyond what's needed to browse/download.
 */
public record PublicLinkInfoResponse(
        String name,
        ShareRole role,
        boolean isFolder,
        boolean requiresPassword,
        List<FileResponse> childFiles,   // populated for folder links only
        List<FolderResponse> childFolders // populated for folder links only
) {}
