package com.cinex.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class SectionRequest {
    @NotBlank(message = "Section name is required")
    private String name;

    @NotBlank(message = "Seat type is required")
    private String seatType;

    @Min(value = 1, message = "Rows must be at least 1")
    private int rows;

    @Min(value = 1, message = "Columns must be at least 1")
    private int cols;

    @Positive(message = "Price multiplier must be positive")
    private double priceMultiplier;
}
