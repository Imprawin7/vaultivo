package com.vaultivo.repository;

import com.vaultivo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByAuthProviderAndProviderSubjectId(
            User.AuthProvider authProvider, String providerSubjectId);

    List<User> findAllByOrderByCreatedAtDesc();

    long countByActiveTrue();

    @Query("SELECT COALESCE(SUM(u.storageUsedBytes), 0) FROM User u")
    long sumStorageUsedBytes();
}