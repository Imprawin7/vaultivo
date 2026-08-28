package com.vaultivo.dto;

import java.util.List;

/**
 * Folder metadata plus its breadcrumb and immediate children — one call
 * gives the frontend everything it needs to render a directory view.
 */
public record FolderDetailResponse(
        FolderResponse folder,
        List<BreadcrumbItem> breadcrumb,
        List<FolderResponse> childFolders,
        List<FileResponse> childFiles
) {}
