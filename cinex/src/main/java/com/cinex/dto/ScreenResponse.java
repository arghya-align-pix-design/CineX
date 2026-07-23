package com.cinex.dto;

import lombok.Data;

/**
 * Response DTO for Screen data including the full layout.
 */
@Data
public class ScreenResponse {
    private Long id;
    private String name;
    private String soundSystem;
    private String projection;
    private int totalSeats;
    private int maxCapacity;
    private boolean active;
    private ScreenLayout screenLayout;
}
