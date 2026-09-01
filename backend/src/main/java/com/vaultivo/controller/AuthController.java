package com.vaultivo.controller;

import com.vaultivo.dto.AuthResponse;
import com.vaultivo.dto.LoginRequest;
import com.vaultivo.dto.RegisterRequest;
import com.vaultivo.dto.UserResponse;
import com.vaultivo.security.UserPrincipal;
import com.vaultivo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(UserResponse.from(principal.getUser()));
    }

    /**
     * Purely for the activity log — JWTs are stateless here, so this does
     * NOT invalidate the token (it stays valid until natural expiry). The
     * frontend still clears its stored token on logout regardless of this
     * call succeeding; this just records that the user chose to log out.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
