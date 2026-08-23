package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Data
@NoArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column(nullable = false, length = 64)
    private String family;

    public RefreshToken(String token, String userEmail, Instant createdAt, Instant expiresAt, String family) {
        this.token = token;
        this.userEmail = userEmail;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.revoked = false;
        this.family = family;
    }
}
