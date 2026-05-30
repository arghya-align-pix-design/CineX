package com.cinex.dto;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MovieRequest {
    private String title;
    private String description;
    private String genre;
    private String language;
    private int durationMins;
    private String posterUrl;
    private boolean is3D;
    private LocalDate releaseDate;
    private LocalDate endDate;
}
