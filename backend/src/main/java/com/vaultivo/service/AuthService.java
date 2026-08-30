package com.vaultivo.service;

import com.vaultivo.activity.ActivityAction;
import com.vaultivo.activity.ActivityLogService;
import com.vaultivo.dto.AuthResponse;
import com.vaultivo.dto.LoginRequest;
import com.vaultivo.dto.RegisterRequest;
import com.vaultivo.dto.UserResponse;
import com.vaultivo.exception.EmailAlreadyExistsException;
import com.vaultivo.exception.InvalidCredentialsException;
import com.vaultivo.model.User;
import com.vaultivo.repository.UserRepository;
import com.vaultivo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ActivityLogService activityLogService;

    @Value("${app.storage.default-quota-bytes:5368709120}")
    private long defaultQuotaBytes;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .authProvider(User.AuthProvider.LOCAL)
                .storageQuotaBytes(defaultQuotaBytes)
                .storageUsedBytes(0L)
                .active(true)
                .build();

        user = userRepository.save(user);
        activityLogService.log(user.getId(), ActivityAction.REGISTER);

        return issueTokenFor(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        // Users provisioned purely via OAuth have no local password to check against.
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (!user.isActive()) {
            throw new InvalidCredentialsException();
        }

        activityLogService.log(user.getId(), ActivityAction.LOGIN, java.util.Map.of("method", "password"));

        return issueTokenFor(user);
    }

    private AuthResponse issueTokenFor(User user) {
        String token = jwtService.generateAccessToken(user.getId(), user.getEmail());
        return AuthResponse.of(token, jwtService.getAccessTokenExpirySeconds(), UserResponse.from(user));
    }
}
