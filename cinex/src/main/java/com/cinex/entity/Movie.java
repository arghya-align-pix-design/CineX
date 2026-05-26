package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "movies")
@Data
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private Genre genre;

    @Enumerated(EnumType.STRING)
    private Language language;

    private int durationMins;
    private String posterUrl;
    private boolean is3D = false;
    private LocalDate releaseDate;
    private LocalDate endDate;

    @Column(nullable = false)
    private boolean isActive = true;

    public enum Genre {
        ACTION, COMEDY, HORROR, DRAMA, THRILLER, ROMANCE, SCIFI, ANIMATION
    }

    public enum Language {
        HINDI, ENGLISH, TELUGU, TAMIL, KANNADA, MALAYALAM, BENGALI
    }
}