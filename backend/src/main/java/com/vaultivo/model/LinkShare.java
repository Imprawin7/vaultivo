package com.vaultivo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** Public share link. Points at EXACTLY ONE of file/folder — chk_link_target. */
@Entity
@Table(name = "link_shares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkShare {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "folder_id")
    private UUID folderId;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ShareRole role = ShareRole.VIEWER;

    @Column(name = "password_hash")
    private String passwordHash; // null = no password required

    @Column(name = "expires_at")
    private Instant expiresAt; // null = never expires

    @Column(name = "created_by_id", nullable = false)
    private UUID createdById;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public boolean isUsable() {
        Instant now = Instant.now();
        return revokedAt == null && (expiresAt == null || expiresAt.isAfter(now));
    }
}
