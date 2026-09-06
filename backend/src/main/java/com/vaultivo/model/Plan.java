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
 * A labeled quota tier (Free, Pro, ...). Assigning a plan to a user SETS
 * their storageQuotaBytes as a side effect (see AdminService.updateUser) —
 * this table is a billing/organizational label, not the live source of
 * truth quota checks read from (that stays User.storageQuotaBytes).
 */
@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "quota_bytes", nullable = false)
    private long quotaBytes;

    @Column(name = "price_cents", nullable = false)
    @Builder.Default
    private int priceCents = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
