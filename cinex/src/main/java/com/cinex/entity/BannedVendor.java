package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "banned_vendors")
@Data
public class BannedVendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime bannedAt;

    @Column(nullable = false)
    private String bannedBy;
}
