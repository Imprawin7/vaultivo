package com.vaultivo.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaultivo.dto.ErrorResponse;
import com.vaultivo.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

/**
 * Runs on every /api/** request. Keyed by user ID when a valid-looking JWT
 * is present, otherwise by client IP — deliberately lenient about token
 * validity here (a malformed/expired token just falls back to IP-based
 * limiting) since JwtAuthenticationFilter is the actual authority on
 * whether a token is accepted; this filter only needs a stable identity to
 * count against.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (!path.startsWith("/api")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean isPublicLink = path.startsWith("/api/public-links");
        RateLimitService.LimitType type =
                isPublicLink ? RateLimitService.LimitType.PUBLIC_LINK : RateLimitService.LimitType.API;

        // Public-link traffic is anonymous by nature, so always key by IP —
        // even if the caller happens to also be a logged-in user, we're
        // rate-limiting the anonymous-access surface specifically.
        String key = isPublicLink ? "ip:" + clientIp(request) : resolveKey(request);

        if (!rateLimitService.tryConsume(key, type)) {
            writeTooManyRequests(response, request.getRequestURI());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveKey(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring("Bearer ".length());
            try {
                if (jwtService.isTokenValid(token)) {
                    return "user:" + jwtService.extractUserId(token);
                }
            } catch (RuntimeException ignored) {
                // Malformed token — fall through to IP-based key below.
            }
        }
        return "ip:" + clientIp(request);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim(); // left-most = original client
        }
        return request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response, String path) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                "Rate limit exceeded — please slow down.",
                path);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
