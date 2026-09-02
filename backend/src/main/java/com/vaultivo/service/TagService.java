package com.vaultivo.service;

import com.vaultivo.dto.*;
import com.vaultivo.exception.DuplicateNameException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.Tag;
import com.vaultivo.model.TagAssignment;
import com.vaultivo.repository.FileRepository;
import com.vaultivo.repository.FolderRepository;
import com.vaultivo.repository.TagAssignmentRepository;
import com.vaultivo.repository.TagRepository;
import com.vaultivo.security.AccessLevel;
import com.vaultivo.security.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Tags are a personal label vocabulary — each user's tags are entirely
 * their own (uq_tag_owner_name scopes uniqueness per-user, not globally).
 * Assigning/removing a tag only requires VIEWER access to the item being
 * tagged, since tagging doesn't mutate the item's real content — it's the
 * tagger's own annotation. A tag itself can only ever be managed (renamed,
 * deleted, assigned) by the user who created it.
 */
@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TagAssignmentRepository tagAssignmentRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final PermissionService permissionService;

    @Transactional
    public TagResponse createTag(UUID userId, TagCreateRequest request) {
        if (tagRepository.existsByOwnerIdAndName(userId, request.name())) {
            throw new DuplicateNameException(request.name());
        }
        Tag tag = Tag.builder()
                .ownerId(userId)
                .name(request.name())
                .color(request.color())
                .build();
        return TagResponse.from(tagRepository.save(tag));
    }

    public List<TagResponse> listTags(UUID userId) {
        return tagRepository.findByOwnerIdOrderByNameAsc(userId).stream().map(TagResponse::from).toList();
    }

    @Transactional
    public void deleteTag(UUID userId, UUID tagId) {
        Tag tag = requireOwnedTag(userId, tagId);
        tagRepository.delete(tag); // cascades tag_assignments rows (ON DELETE CASCADE)
    }

    @Transactional
    public void assignToFile(UUID userId, UUID tagId, UUID fileId) {
        requireOwnedTag(userId, tagId);
        permissionService.requireFileAccess(userId, fileId, AccessLevel.VIEWER);
        if (tagAssignmentRepository.existsByTagIdAndFileId(tagId, fileId)) {
            return; // already tagged — idempotent, not an error
        }
        tagAssignmentRepository.save(TagAssignment.builder().tagId(tagId).fileId(fileId).build());
    }

    @Transactional
    public void removeFromFile(UUID userId, UUID tagId, UUID fileId) {
        requireOwnedTag(userId, tagId);
        tagAssignmentRepository.findByTagIdAndFileId(tagId, fileId)
                .ifPresent(tagAssignmentRepository::delete);
    }

    @Transactional
    public void assignToFolder(UUID userId, UUID tagId, UUID folderId) {
        requireOwnedTag(userId, tagId);
        permissionService.requireFolderAccess(userId, folderId, AccessLevel.VIEWER);
        if (tagAssignmentRepository.existsByTagIdAndFolderId(tagId, folderId)) {
            return;
        }
        tagAssignmentRepository.save(TagAssignment.builder().tagId(tagId).folderId(folderId).build());
    }

    @Transactional
    public void removeFromFolder(UUID userId, UUID tagId, UUID folderId) {
        requireOwnedTag(userId, tagId);
        tagAssignmentRepository.findByTagIdAndFolderId(tagId, folderId)
                .ifPresent(tagAssignmentRepository::delete);
    }

    /** Tags currently on a file — for populating a "manage tags" UI. Read-only, VIEWER is enough. */
    public List<TagResponse> tagsForFile(UUID userId, UUID fileId) {
        permissionService.requireFileAccess(userId, fileId, AccessLevel.VIEWER);
        return tagAssignmentRepository.findByFileId(fileId).stream()
                .map(a -> tagRepository.findById(a.getTagId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .filter(t -> t.getOwnerId().equals(userId)) // only show the caller's OWN tags, not other users' tags on a shared item
                .map(TagResponse::from)
                .toList();
    }

    public List<TagResponse> tagsForFolder(UUID userId, UUID folderId) {
        permissionService.requireFolderAccess(userId, folderId, AccessLevel.VIEWER);
        return tagAssignmentRepository.findByFolderId(folderId).stream()
                .map(a -> tagRepository.findById(a.getTagId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .filter(t -> t.getOwnerId().equals(userId))
                .map(TagResponse::from)
                .toList();
    }

    /** Every file/folder the caller has tagged with this tag — "browse by tag" / "filter by tag". */
    public TaggedItemsResponse itemsByTag(UUID userId, UUID tagId) {
        requireOwnedTag(userId, tagId);

        List<FileResponse> files = tagAssignmentRepository.findByTagId(tagId).stream()
                .filter(a -> a.getFileId() != null)
                .map(a -> fileRepository.findById(a.getFileId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .filter(f -> !f.isTrashed())
                .map(FileResponse::from)
                .toList();

        List<FolderResponse> folders = tagAssignmentRepository.findByTagId(tagId).stream()
                .filter(a -> a.getFolderId() != null)
                .map(a -> folderRepository.findById(a.getFolderId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .filter(f -> !f.isTrashed())
                .map(FolderResponse::from)
                .toList();

        return new TaggedItemsResponse(files, folders);
    }

    // ---------------------------------------------------------------

    private Tag requireOwnedTag(UUID userId, UUID tagId) {
        return tagRepository.findByIdAndOwnerId(tagId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + tagId));
    }
}
