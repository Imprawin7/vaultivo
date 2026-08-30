package com.vaultivo.service;

import com.vaultivo.activity.ActivityAction;
import com.vaultivo.activity.ActivityLogService;
import com.vaultivo.dto.*;
import com.vaultivo.exception.InvalidRequestException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.File;
import com.vaultivo.model.UploadAttempt;
import com.vaultivo.model.User;
import com.vaultivo.repository.*;
import com.vaultivo.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final ActivityRepository activityRepository;
    private final UploadAttemptRepository uploadAttemptRepository;
    private final StorageService storageService;
    private final ActivityLogService activityLogService;

    // ---------------------------------------------------------------
    // Overview
    // ---------------------------------------------------------------

    public PlatformStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActiveTrue();
        return new PlatformStatsResponse(
                totalUsers,
                activeUsers,
                totalUsers - activeUsers,
                fileRepository.count(),
                folderRepository.count(),
                userRepository.sumStorageUsedBytes(),
                userRepository.sumStorageQuotaBytes());
    }

    // ---------------------------------------------------------------
    // User management
    // ---------------------------------------------------------------

    public List<AdminUserResponse> listUsers(String query) {
        List<User> users = (query == null || query.isBlank())
                ? userRepository.findAllByOrderByCreatedAtDesc()
                : userRepository.searchByEmailOrName(query.trim());
        return users.stream().map(AdminUserResponse::from).toList();
    }

    /** Same data as listUsers, sorted by storage used descending, capped at {@code limit}. */
    public List<AdminUserResponse> topStorageUsers(int limit) {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .sorted((a, b) -> Long.compare(b.getStorageUsedBytes(), a.getStorageUsedBytes()))
                .limit(limit)
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse updateUser(UUID callingAdminId, UUID targetUserId, AdminUserUpdateRequest request) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        boolean isSelf = targetUserId.equals(callingAdminId);

        if (request.active() != null && !request.active() && isSelf) {
            throw new InvalidRequestException("You cannot deactivate your own account");
        }
        if (request.admin() != null && !request.admin() && isSelf) {
            throw new InvalidRequestException("You cannot remove your own admin access");
        }

        if (request.active() != null) {
            target.setActive(request.active());
            activityLogService.log(callingAdminId,
                    request.active() ? ActivityAction.ADMIN_REACTIVATE_USER : ActivityAction.ADMIN_SUSPEND_USER,
                    Map.of("targetUserId", targetUserId.toString(), "targetEmail", target.getEmail()));
        }
        if (request.storageQuotaBytes() != null) {
            if (request.storageQuotaBytes() < 0) {
                throw new InvalidRequestException("Storage quota cannot be negative");
            }
            target.setStorageQuotaBytes(request.storageQuotaBytes());
            activityLogService.log(callingAdminId, ActivityAction.ADMIN_CHANGE_QUOTA,
                    Map.of("targetUserId", targetUserId.toString(), "targetEmail", target.getEmail(),
                            "newQuotaBytes", request.storageQuotaBytes()));
        }
        if (request.admin() != null) {
            target.setAdmin(request.admin());
            activityLogService.log(callingAdminId,
                    request.admin() ? ActivityAction.ADMIN_GRANT_ADMIN : ActivityAction.ADMIN_REVOKE_ADMIN,
                    Map.of("targetUserId", targetUserId.toString(), "targetEmail", target.getEmail()));
        }

        return AdminUserResponse.from(userRepository.save(target));
    }

    /**
     * Irreversible. Deletes every S3 object the user owns, then deletes the
     * user row — folders/files/shares/link_shares/activities all cascade at
     * the DB level via ON DELETE CASCADE (see schema.sql), so we only need
     * to handle S3 cleanup explicitly here.
     */
    @Transactional
    public void deleteUserAccount(UUID callingAdminId, UUID targetUserId) {
        if (targetUserId.equals(callingAdminId)) {
            throw new InvalidRequestException("You cannot delete your own account");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        // Files carry owner_id directly, so this gets every file the user
        // owns regardless of folder nesting depth or trash status — no need
        // to walk the folder tree (folders themselves have no S3 objects;
        // their rows cascade-delete automatically once the user row does).
        List<File> ownedFiles = fileRepository.findByOwnerId(targetUserId);

        // Best-effort: log before delete, since the actor row referenced by
        // the LOG ITSELF would otherwise vanish along with the target if this
        // were logged as the target's own activity — logged as the admin's action instead.
        activityLogService.log(callingAdminId, ActivityAction.ADMIN_DELETE_ACCOUNT,
                Map.of("targetUserId", targetUserId.toString(), "targetEmail", target.getEmail()));

        ownedFiles.forEach(f -> storageService.deleteObject(f.getStorageKey()));

        userRepository.delete(target);
    }

    // ---------------------------------------------------------------
    // Security — audit log
    // ---------------------------------------------------------------

    public List<ActivityResponse> recentActivity(int limit) {
        return activityRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit, Sort.unsorted()))
                .stream()
                .map(a -> ActivityResponse.from(a, resolveEmail(a.getActorId())))
                .toList();
    }

    private String resolveEmail(UUID userId) {
        return userRepository.findById(userId).map(User::getEmail).orElse("(deleted user)");
    }

    // ---------------------------------------------------------------
    // Storage — failed uploads
    // ---------------------------------------------------------------

    /** "Failed" = still PENDING at least 30 minutes after creation — well past the
     *  15-minute presigned URL expiry, so it was never going to complete. */
    public List<FailedUploadResponse> failedUploads() {
        Instant threshold = Instant.now().minus(Duration.ofMinutes(30));
        return uploadAttemptRepository
                .findByStatusAndCreatedAtBeforeOrderByCreatedAtDesc(UploadAttempt.Status.PENDING, threshold)
                .stream()
                .map(a -> FailedUploadResponse.from(a, resolveEmail(a.getOwnerId())))
                .toList();
    }
}
