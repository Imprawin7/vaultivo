package com.vaultivo.dto;

import java.util.List;

public record SharedWithMeResponse(
        List<FileResponse> files,
        List<FolderResponse> folders
) {}
