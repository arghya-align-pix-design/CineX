package com.cinex.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class MovieRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Genre is required")
    private String genre;

    @NotBlank(message = "Language is required")
    private String language;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private int durationMins;

    private String posterUrl;
    private boolean is3D;

    @NotNull(message = "Release date is required")
    private LocalDate releaseDate;

    private LocalDate endDate;
    private String producer;
    private String director;
    private String actors;
    private List<String> imageUrls;
}
