package com.cinex.entity;

import org.hibernate.annotations.Type;

import com.cinex.dto.ScreenLayout;
import com.fasterxml.jackson.annotation.JsonIgnore;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * Represents a single screen/auditorium within a Theatre location.
 * Hierarchy: Theatre (Cinema Hall) → Screen (Audi 1, Screen 2 IMAX) → ScreenLayout (visual seat map).
 *
 * The entire seat layout is stored as a JSONB column (screenLayout)
 * which contains rows, seats, zones, aisles, and metadata.
 */
@Entity
@Table(name = "screens")
@Data
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;              // "Audi 1", "Screen 3 IMAX"

    private String soundSystem;       // "Dolby Atmos", "DTS", "Standard"
    private String projection;        // "2D", "3D", "IMAX", "4DX"

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private ScreenLayout screenLayout; // The entire visual seat map

    @Column(nullable = false)
    private int totalSeats = 0;       // Computed from layout on save

    @Column(nullable = false)
    private int maxCapacity = 200;    // Vendor-chosen cap: 100–1000

    @Column(nullable = false)
    private boolean isActive = true;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theatre_id", nullable = false)
    private Theatre theatre;
}
