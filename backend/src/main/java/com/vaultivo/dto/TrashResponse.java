package com.vaultivo.dto;

import java.util.List;

/**
 * Lists every trashed file/folder for the user. Note: this includes items
 * trashed as a cascading side-effect of a parent folder being trashed, not
 * just the top-level item the user explicitly deleted — unlike Google
 * Drive's trash view, which shows only the top-level deletions. Flagged as
 * a known MVP simplification rather than filtering the tree client-side.
 */
public record TrashResponse(
        List<FileResponse> files,
        List<FolderResponse> folders
) {}
