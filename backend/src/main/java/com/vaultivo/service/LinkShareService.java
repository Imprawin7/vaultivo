package com.vaultivo.service;

import com.vaultivo.dto.*;
import com.vaultivo.exception.InvalidLinkPasswordException;
import com.vaultivo.exception.LinkExpiredException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.File;
import com.vaultivo.model.Folder;
import com.vaultivo.model.LinkShare;
import com.vaultivo.repository.FileRepository;
import com.vaultivo.repository.FolderRepository;
import com.vaultivo.repository.LinkShareRepository;
import com.vaultivo.security.AccessLevel;
import com.vaultivo.security.PermissionService;
import com.vaultivo.storage.PresignedDownload;
import com.vaultivo.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LinkShareService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final LinkShareRepository linkShareRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final PermissionService permissionService;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;

    @Transactional
    public LinkShareResponse createForFile(UUID ownerId, UUID fileId, LinkShareCreateRequest request) {
        permissionService.requireFileAccess(ownerId, fileId, AccessLevel.OWNER);

        LinkShare link = LinkShare.builder()
                .fileId(fileId)
                .role(request.role())
                .passwordHash(hashOrNull(request.password()))
                .expiresAt(computeExpiry(request.expiresInHours()))
                .createdById(ownerId)
                .token(generateToken())
                .build();

        return LinkShareResponse.from(linkShareRepository.save(link));
    }

    @Transactional
    public LinkShareResponse createForFolder(UUID ownerId, UUID folderId, LinkShareCreateRequest request) {
        permissionService.requireFolderAccess(ownerId, folderId, AccessLevel.OWNER);

        LinkShare link = LinkShare.builder()
                .folderId(folderId)
                .role(request.role())
                .passwordHash(hashOrNull(request.password()))
                .expiresAt(computeExpiry(request.expiresInHours()))
                .createdById(ownerId)
                .token(generateToken())
                .build();

        return LinkShareResponse.from(linkShareRepository.save(link));
    }

    public List<LinkShareResponse> listForFile(UUID ownerId, UUID fileId) {
        permissionService.requireFileAccess(ownerId, fileId, AccessLevel.OWNER);
        return linkShareRepository.findByFileId(fileId).stream().map(LinkShareResponse::from).toList();
    }

    public List<LinkShareResponse> listForFolder(UUID ownerId, UUID folderId) {
        permissionService.requireFolderAccess(ownerId, folderId, AccessLevel.OWNER);
        return linkShareRepository.findByFolderId(folderId).stream().map(LinkShareResponse::from).toList();
    }

    @Transactional
    public void revoke(UUID ownerId, UUID linkShareId) {
        LinkShare link = linkShareRepository.findById(linkShareId)
                .orElseThrow(() -> new ResourceNotFoundException("Link not found: " + linkShareId));

        // Confirm the caller actually owns the underlying resource, not just
        // that they created some link somewhere.
        if (link.getFileId() != null) {
            permissionService.requireFileAccess(ownerId, link.getFileId(), AccessLevel.OWNER);
        } else {
            permissionService.requireFolderAccess(ownerId, link.getFolderId(), AccessLevel.OWNER);
        }

        link.setRevokedAt(Instant.now());
        linkShareRepository.save(link);
    }

    // ---------------------------------------------------------------
    // Anonymous access — no auth, validated purely by token + password.
    // ---------------------------------------------------------------

    /**
     * Info + listing (for folder links) needed to render the public page.
     * If the link is password-protected and no correct password is supplied,
     * the response reports requiresPassword=true with empty listings rather
     * than throwing — that lets the frontend show a password prompt without
     * a 401 flash. A wrong (non-null) password DOES throw, so brute-forcing
     * still gets rejected rather than silently falling back to "no children".
     */
    public PublicLinkInfoResponse getPublicInfo(String token, String suppliedPassword) {
        LinkShare link = requireUsableLink(token);
        boolean requiresPassword = link.getPasswordHash() != null;

        boolean unlocked = !requiresPassword;
        if (requiresPassword && suppliedPassword != null) {
            checkPassword(link, suppliedPassword); // throws on wrong password
            unlocked = true;
        }

        if (link.getFileId() != null) {
            File file = fileRepository.findById(link.getFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("File no longer exists"));
            return new PublicLinkInfoResponse(file.getName(), link.getRole(), false, requiresPassword, List.of(), List.of());
        }

        Folder folder = folderRepository.findById(link.getFolderId())
                .orElseThrow(() -> new ResourceNotFoundException("Folder no longer exists"));

        if (!unlocked) {
            return new PublicLinkInfoResponse(folder.getName(), link.getRole(), true, true, List.of(), List.of());
        }

        List<FileResponse> childFiles = fileRepository
                .findByOwnerIdAndFolderIdAndTrashedFalseOrderByNameAsc(folder.getOwnerId(), folder.getId())
                .stream().map(FileResponse::from).toList();
        List<FolderResponse> childFolders = folderRepository
                .findByOwnerIdAndParentIdAndTrashedFalseOrderByNameAsc(folder.getOwnerId(), folder.getId())
                .stream().map(FolderResponse::from).toList();
        return new PublicLinkInfoResponse(folder.getName(), link.getRole(), true, requiresPassword, childFiles, childFolders);
    }

    /** Validates the password (if required) and returns a presigned download URL for a file link. */
    public DownloadUrlResponse getPublicDownloadUrl(String token, String suppliedPassword) {
        LinkShare link = requireUsableLink(token);

        if (link.getFileId() == null) {
            throw new ResourceNotFoundException("This link does not point to a single downloadable file");
        }

        checkPassword(link, suppliedPassword);

        File file = fileRepository.findById(link.getFileId())
                .orElseThrow(() -> new ResourceNotFoundException("File no longer exists"));

        PresignedDownload presigned = storageService.createPresignedDownloadUrl(file.getStorageKey(), file.getName());
        return new DownloadUrlResponse(presigned.downloadUrl(), presigned.expiresAt());
    }

    /**
     * Downloads a specific file listed inside a publicly-shared FOLDER link
     * (as opposed to getPublicDownloadUrl, which is for a link pointing
     * directly at one file). Only immediate children of the linked folder
     * are downloadable — matching what getPublicInfo actually exposes,
     * since there's no anonymous drill-down into nested subfolders.
     */
    public DownloadUrlResponse getPublicFolderFileDownloadUrl(String token, UUID fileId, String suppliedPassword) {
        LinkShare link = requireUsableLink(token);

        if (link.getFolderId() == null) {
            throw new ResourceNotFoundException("This link does not point to a folder");
        }

        checkPassword(link, suppliedPassword);

        File file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        // Must actually be an immediate child of the linked folder — prevents
        // using a valid link's password to fetch an arbitrary fileId that
        // has nothing to do with this share.
        if (!link.getFolderId().equals(file.getFolderId())) {
            throw new ResourceNotFoundException("File not found in this shared folder");
        }

        PresignedDownload presigned = storageService.createPresignedDownloadUrl(file.getStorageKey(), file.getName());
        return new DownloadUrlResponse(presigned.downloadUrl(), presigned.expiresAt());
    }

    // ---------------------------------------------------------------

    private LinkShare requireUsableLink(String token) {
        LinkShare link = linkShareRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid link"));
        if (!link.isUsable()) {
            throw new LinkExpiredException();
        }
        return link;
    }

    private void checkPassword(LinkShare link, String suppliedPassword) {
        if (link.getPasswordHash() == null) {
            return; // no password required
        }
        if (suppliedPassword == null || !passwordEncoder.matches(suppliedPassword, link.getPasswordHash())) {
            throw new InvalidLinkPasswordException();
        }
    }

    private String hashOrNull(String rawPassword) {
        return (rawPassword == null || rawPassword.isBlank()) ? null : passwordEncoder.encode(rawPassword);
    }

    private Instant computeExpiry(Integer hours) {
        return hours == null ? null : Instant.now().plusSeconds(hours * 3600L);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
