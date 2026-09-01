package com.vaultivo.service;

import com.vaultivo.activity.ActivityAction;
import com.vaultivo.activity.ActivityLogService;
import com.vaultivo.dto.FileResponse;
import com.vaultivo.dto.FolderResponse;
import com.vaultivo.dto.ShareCreateRequest;
import com.vaultivo.dto.SharedWithMeResponse;
import com.vaultivo.dto.ShareResponse;
import com.vaultivo.exception.InvalidRequestException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.Share;
import com.vaultivo.model.User;
import com.vaultivo.repository.FileRepository;
import com.vaultivo.repository.FolderRepository;
import com.vaultivo.repository.ShareRepository;
import com.vaultivo.repository.UserRepository;
import com.vaultivo.security.AccessLevel;
import com.vaultivo.security.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Only OWNERs may manage sharing (create/revoke) — Editors can modify
 * content but not grant access to others. Enforced via PermissionService
 * with AccessLevel.OWNER on every mutating method here.
 */
@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final PermissionService permissionService;
    private final ActivityLogService activityLogService;

    @Transactional
    public ShareResponse shareFile(UUID ownerId, UUID fileId, ShareCreateRequest request) {
        permissionService.requireFileAccess(ownerId, fileId, AccessLevel.OWNER);
        User target = requireUserByEmail(request.email());

        if (target.getId().equals(ownerId)) {
            throw new InvalidRequestException("You cannot share a file with yourself");
        }

        Share share = shareRepository.findByFileIdAndSharedWithId(fileId, target.getId())
                .map(existing -> {
                    existing.setRole(request.role());
                    return existing;
                })
                .orElseGet(() -> Share.builder()
                        .fileId(fileId)
                        .sharedWithId(target.getId())
                        .sharedById(ownerId)
                        .role(request.role())
                        .build());

        ShareResponse response = ShareResponse.from(shareRepository.save(share), target.getEmail());
        activityLogService.log(ownerId, ActivityAction.SHARE_FILE, fileId, null,
                java.util.Map.of("sharedWithEmail", target.getEmail(), "role", request.role().name()));
        return response;
    }

    @Transactional
    public ShareResponse shareFolder(UUID ownerId, UUID folderId, ShareCreateRequest request) {
        permissionService.requireFolderAccess(ownerId, folderId, AccessLevel.OWNER);
        User target = requireUserByEmail(request.email());

        if (target.getId().equals(ownerId)) {
            throw new InvalidRequestException("You cannot share a folder with yourself");
        }

        Share share = shareRepository.findByFolderIdAndSharedWithId(folderId, target.getId())
                .map(existing -> {
                    existing.setRole(request.role());
                    return existing;
                })
                .orElseGet(() -> Share.builder()
                        .folderId(folderId)
                        .sharedWithId(target.getId())
                        .sharedById(ownerId)
                        .role(request.role())
                        .build());

        ShareResponse response = ShareResponse.from(shareRepository.save(share), target.getEmail());
        activityLogService.log(ownerId, ActivityAction.SHARE_FOLDER, null, folderId,
                java.util.Map.of("sharedWithEmail", target.getEmail(), "role", request.role().name()));
        return response;
    }

    public List<ShareResponse> listFileShares(UUID ownerId, UUID fileId) {
        permissionService.requireFileAccess(ownerId, fileId, AccessLevel.OWNER);
        return shareRepository.findByFileId(fileId).stream()
                .map(this::toResponseWithEmail)
                .toList();
    }

    public List<ShareResponse> listFolderShares(UUID ownerId, UUID folderId) {
        permissionService.requireFolderAccess(ownerId, folderId, AccessLevel.OWNER);
        return shareRepository.findByFolderId(folderId).stream()
                .map(this::toResponseWithEmail)
                .toList();
    }

    @Transactional
    public void revokeFileShare(UUID ownerId, UUID fileId, UUID shareId) {
        permissionService.requireFileAccess(ownerId, fileId, AccessLevel.OWNER);
        Share share = shareRepository.findByIdAndFileId(shareId, fileId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found: " + shareId));
        shareRepository.delete(share);
        activityLogService.log(ownerId, ActivityAction.REVOKE_SHARE, fileId, null, null);
    }

    @Transactional
    public void revokeFolderShare(UUID ownerId, UUID folderId, UUID shareId) {
        permissionService.requireFolderAccess(ownerId, folderId, AccessLevel.OWNER);
        Share share = shareRepository.findByIdAndFolderId(shareId, folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found: " + shareId));
        shareRepository.delete(share);
        activityLogService.log(ownerId, ActivityAction.REVOKE_SHARE, null, folderId, null);
    }

    /** Direct shares only — a file/folder nested inside a shared folder doesn't get its own row here (it's covered by folder-share inheritance in PermissionService, not a separate listing entry). */
    public SharedWithMeResponse listSharedWithMe(UUID userId) {
        List<Share> shares = shareRepository.findBySharedWithId(userId);

        List<FileResponse> files = shares.stream()
                .filter(s -> s.getFileId() != null)
                .map(s -> fileRepository.findById(s.getFileId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .filter(f -> !f.isTrashed())
                .map(FileResponse::from)
                .toList();

        List<FolderResponse> folders = shares.stream()
                .filter(s -> s.getFolderId() != null)
                .map(s -> folderRepository.findById(s.getFolderId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .filter(f -> !f.isTrashed())
                .map(FolderResponse::from)
                .toList();

        return new SharedWithMeResponse(files, folders);
    }

    // ---------------------------------------------------------------

    private User requireUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No user found with email: " + email));
    }

    private ShareResponse toResponseWithEmail(Share share) {
        String email = userRepository.findById(share.getSharedWithId())
                .map(User::getEmail)
                .orElse("unknown");
        return ShareResponse.from(share, email);
    }
}
