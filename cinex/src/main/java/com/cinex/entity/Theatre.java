package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalTime;

@Entity
@Table(name = "theatres")
@Data
public class Theatre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String addressLine;

    @Column(nullable = false)
    private String pincode;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String state;

    private LocalTime openTime;
    private LocalTime closeTime;

    @Column(nullable = false)
    private boolean hasRecliner = false;

    @Column(nullable = false)
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private User vendor;

    @OneToMany(mappedBy = "theatre", cascade = CascadeType.ALL)
    private java.util.List<Section> sections = new java.util.ArrayList<>();
}