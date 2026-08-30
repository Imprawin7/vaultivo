package com.vaultivo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Audit trail entry. Table predates this entity (see V1 schema.sql) — this is the first
 *  application code that actually reads/writes it. */
@Entity
@Table(name = "activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(nullable = false, length = 30)
    private String action; // free-form short code, e.g. LOGIN, ADMIN_SUSPEND_USER — see ActivityAction

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "folder_id")
    private UUID folderId;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
