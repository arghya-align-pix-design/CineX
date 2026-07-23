package com.cinex.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class MovieAdminResponse {
    private Long id;
    private String title;
    private String description;
    private String genre;
    private String language;
    private int durationMins;
    private String posterUrl;
    private boolean is3D;
    private LocalDate releaseDate;
    private LocalDate endDate;
    private String director;
    private String actors;
    private String producer;
    private boolean isActive;
    private long totalViewers;
    private double totalRevenue;
    private List<String> imageUrls;
}
