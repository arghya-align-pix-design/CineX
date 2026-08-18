package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Records every important action in the system.
 * This is the "blame table" — who did what, to whom, and when.
 */
@Entity
@Table(name = "audit_log", indexes = {
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_actor", columnList = "actorEmail"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    /** Who performed the action (email of admin/vendor/system) */
    @Column(nullable = false)
    private String actorEmail;

    /** What type of thing was affected (e.g., "VENDOR", "MOVIE", "BOOKING") */
    @Column(nullable = false)
    private String targetType;

    /** ID or identifier of the affected entity */
    private String targetId;

    /** Human-readable description of what happened */
    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
