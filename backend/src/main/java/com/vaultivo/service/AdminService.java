package com.vaultivo.service;

import com.vaultivo.dto.AdminUserResponse;
import com.vaultivo.dto.AdminUserUpdateRequest;
import com.vaultivo.dto.PlatformStatsResponse;
import com.vaultivo.exception.InvalidRequestException;
import com.vaultivo.exception.ResourceNotFoundException;
import com.vaultivo.model.User;
import com.vaultivo.repository.FileRepository;
import com.vaultivo.repository.FolderRepository;
import com.vaultivo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;

    public List<AdminUserResponse> listUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    public PlatformStatsResponse getStats() {
        return new PlatformStatsResponse(
                userRepository.count(),
                userRepository.countByActiveTrue(),
                fileRepository.count(),
                folderRepository.count(),
                userRepository.sumStorageUsedBytes());
    }

    @Transactional
    public AdminUserResponse updateUser(UUID callingAdminId, UUID targetUserId, AdminUserUpdateRequest request) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        // An admin deactivating their own account would lock them out with
        // no way back in (no other admin action can re-activate someone once
        // JWT auth itself starts rejecting them) — block it outright rather
        // than let it happen by accident.
        if (request.active() != null && !request.active() && targetUserId.equals(callingAdminId)) {
            throw new InvalidRequestException("You cannot deactivate your own account");
        }

        if (request.active() != null) {
            target.setActive(request.active());
        }
        if (request.storageQuotaBytes() != null) {
            if (request.storageQuotaBytes() < 0) {
                throw new InvalidRequestException("Storage quota cannot be negative");
            }
            target.setStorageQuotaBytes(request.storageQuotaBytes());
        }

        return AdminUserResponse.from(userRepository.save(target));
    }
}