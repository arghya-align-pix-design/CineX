package com.cinex.dto;
import lombok.Data;

@Data
public class SectionResponse {
    private Long id;
    private String name;
    private String seatType;
    private int rows;
    private int cols;
    private double priceMultiplier;
    private boolean active;
    private SeatGridConfig seatGrid;
}
