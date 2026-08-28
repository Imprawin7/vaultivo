package com.vaultivo.repository;

import com.vaultivo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByAuthProviderAndProviderSubjectId(
            User.AuthProvider authProvider, String providerSubjectId);
}
