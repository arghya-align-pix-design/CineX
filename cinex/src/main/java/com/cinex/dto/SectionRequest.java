package com.cinex.dto;
import lombok.Data;

@Data
public class SectionRequest {
    private String name;
    private String seatType;
    private int rows;
    private int cols;
    private double priceMultiplier;
}
