package com.vaultivo.dto;

import java.util.List;

public record TaggedItemsResponse(
        List<FileResponse> files,
        List<FolderResponse> folders
) {}
