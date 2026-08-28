package com.vaultivo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class File {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "folder_id")
    private UUID folderId; // NULL = lives at root

    @Column(nullable = false)
    private String name;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "current_version", nullable = false)
    @Builder.Default
    private int currentVersion = 1;

    @Column(name = "checksum_sha256")
    private String checksumSha256;

    @Column(name = "is_starred", nullable = false)
    @Builder.Default
    private boolean starred = false;

    @Column(name = "is_trashed", nullable = false)
    @Builder.Default
    private boolean trashed = false;

    @Column(name = "trashed_at")
    private Instant trashedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
