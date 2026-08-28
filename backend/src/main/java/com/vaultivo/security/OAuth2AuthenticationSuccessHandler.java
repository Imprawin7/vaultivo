package com.vaultivo.security;

import com.vaultivo.model.User;
import com.vaultivo.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth2/callback}")
    private String redirectUri;

    @Value("${app.storage.default-quota-bytes:5368709120}")
    private long defaultQuotaBytes;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String googleSubjectId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        User user = userRepository
                .findByAuthProviderAndProviderSubjectId(User.AuthProvider.GOOGLE, googleSubjectId)
                .or(() -> userRepository.findByEmail(email)) // link if a LOCAL account already used this email
                .map(existing -> {
                    // Keep provider linkage and profile fields fresh on repeat logins
                    existing.setAuthProvider(User.AuthProvider.GOOGLE);
                    existing.setProviderSubjectId(googleSubjectId);
                    existing.setAvatarUrl(picture);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .displayName(name != null ? name : email)
                        .avatarUrl(picture)
                        .authProvider(User.AuthProvider.GOOGLE)
                        .providerSubjectId(googleSubjectId)
                        .storageQuotaBytes(defaultQuotaBytes)
                        .storageUsedBytes(0L)
                        .active(true)
                        .build()));

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", accessToken)
                .build()
                .toUriString();

        response.sendRedirect(targetUrl);
    }
}
