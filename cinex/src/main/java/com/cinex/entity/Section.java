package com.cinex.entity;

import org.hibernate.annotations.Type;

import com.cinex.dto.SeatGridConfig;
import com.fasterxml.jackson.annotation.JsonIgnore;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;




@Entity
@Table(name = "seatsections")
@Data
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatType seatType;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private SeatGridConfig seatGrid;

    @Column(nullable = false)
    private int rows;

    @Column(nullable = false)
    private int cols;

    @Column(nullable = false)
    private double priceMultiplier = 1.0;

    @Column(nullable = false)
    private boolean isActive = true;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theatre_id", nullable = false)
    private Theatre theatre;

    public enum SeatType {
        EXECUTIVE, SILVER, GOLD, BALCONY, PLATINUM, RECLINER
    }
}