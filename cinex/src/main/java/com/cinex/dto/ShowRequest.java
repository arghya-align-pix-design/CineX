package com.cinex.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ShowRequest {
    @NotNull(message = "Movie ID is required")
    private Long movieId;

    @NotNull(message = "Theatre ID is required")
    private Long theatreId;

    // Legacy: Section-based shows (nullable for new screen-based flow)
    private Long sectionId;

    // New: Screen-based shows (nullable for legacy section-based flow)
    private Long screenId;

    @NotNull(message = "Show date is required")
    private LocalDate showDate;

    private LocalDate endDate;

    @NotNull(message = "Show time is required")
    private LocalTime showTime;

    @Positive(message = "Base price must be positive")
    private double basePrice;
}
