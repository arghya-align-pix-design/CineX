package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "oauth_exchange_codes")
@Data
@NoArgsConstructor
public class OAuthExchangeCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    public OAuthExchangeCode(String code, String userEmail, Instant expiresAt) {
        this.code = code;
        this.userEmail = userEmail;
        this.expiresAt = expiresAt;
        this.used = false;
    }
}
