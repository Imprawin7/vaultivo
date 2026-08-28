package com.vaultivo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiryMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiry-minutes}") long accessTokenExpiryMinutes) {
        // HS256 requires a key of at least 256 bits — enforce that early rather
        // than failing cryptically at sign time.
        if (secret.getBytes().length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret must be at least 256 bits (32 bytes) long");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiryMinutes = accessTokenExpiryMinutes;
    }

    public String generateAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(accessTokenExpiryMinutes * 60);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public long getAccessTokenExpirySeconds() {
        return accessTokenExpiryMinutes * 60;
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaim(token, Claims::getSubject));
    }

    public String extractEmail(String token) {
        return extractClaim(token, claims -> claims.get("email", String.class));
    }

    public boolean isTokenValid(String token) {
        try {
            Date expiration = extractClaim(token, Claims::getExpiration);
            return expiration.after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }
}
