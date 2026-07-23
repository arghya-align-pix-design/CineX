package com.cinex.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for creating or updating a Screen's metadata.
 * Does NOT include the layout — that uses ScreenLayoutRequest separately.
 */
@Data
public class ScreenRequest {

    @NotBlank(message = "Screen name is required")
    private String name;             // "Audi 1", "Screen 3 IMAX"

    private String soundSystem;      // "Dolby Atmos", "DTS", "Standard"
    private String projection;       // "2D", "3D", "IMAX", "4DX"

    @Min(value = 100, message = "Max capacity must be at least 100")
    @Max(value = 1000, message = "Max capacity cannot exceed 1000")
    private int maxCapacity = 200;   // Vendor-chosen seat cap
}
