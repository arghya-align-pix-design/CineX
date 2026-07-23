package com.cinex.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for saving the entire visual seat layout of a Screen.
 * The frontend designer serializes its state into a ScreenLayout object
 * and sends it via PUT /screens/{id}/layout.
 */
@Data
public class ScreenLayoutRequest {

    @NotNull(message = "Screen layout data is required")
    private ScreenLayout layout;
}
