package com.vaultivo.dto;

import java.util.List;

public record SearchResultResponse(
        List<FileResponse> files,
        List<FolderResponse> folders
) {}
