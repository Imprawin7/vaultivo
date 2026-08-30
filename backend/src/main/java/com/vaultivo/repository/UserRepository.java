package com.vaultivo.repository;

import com.vaultivo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByAuthProviderAndProviderSubjectId(
            User.AuthProvider authProvider, String providerSubjectId);

    List<User> findAllByOrderByCreatedAtDesc();

    @Query(value = """
            SELECT * FROM users
            WHERE email ILIKE '%' || :query || '%' OR display_name ILIKE '%' || :query || '%'
            ORDER BY created_at DESC
            """, nativeQuery = true)
    List<User> searchByEmailOrName(@Param("query") String query);

    long countByActiveTrue();

    @Query("SELECT COALESCE(SUM(u.storageUsedBytes), 0) FROM User u")
    long sumStorageUsedBytes();

    @Query("SELECT COALESCE(SUM(u.storageQuotaBytes), 0) FROM User u")
    long sumStorageQuotaBytes();
}
