package com.cinex.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    @JsonProperty("is3D")
    private boolean is3D = false;

    private LocalDate releaseDate;
    private LocalDate endDate;

    @Column(nullable = false)
    @JsonProperty("isActive")
    private boolean isActive = true;

    private String producer;
    private String director;
    private String actors;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MovieImage> images = new ArrayList<>();

    public enum Genre {
        ACTION, COMEDY, HORROR, DRAMA, THRILLER, ROMANCE, SCIFI, ANIMATION
    }

    public enum Language {
        HINDI, ENGLISH, TELUGU, TAMIL, KANNADA, MALAYALAM, BENGALI
    }
}