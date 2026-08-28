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

/**
 * Direct user-to-user share. Points at EXACTLY ONE of file/folder — enforced
 * by chk_share_target in the schema. Sharing a folder implicitly grants the
 * same role to everything inside it (see PermissionService) rather than
 * requiring a share row per descendant.
 */
@Entity
@Table(name = "shares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Share {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "folder_id")
    private UUID folderId;

    @Column(name = "shared_with_id", nullable = false)
    private UUID sharedWithId;

    @Column(name = "shared_by_id", nullable = false)
    private UUID sharedById;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShareRole role;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
