package com.cinex.service;

import com.cinex.dto.MovieRequest;
import com.cinex.entity.Movie;
import com.cinex.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    public Movie createMovie(MovieRequest request) {
        Movie movie = new Movie();
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setGenre(Movie.Genre.valueOf(request.getGenre().toUpperCase()));
        movie.setLanguage(Movie.Language.valueOf(request.getLanguage().toUpperCase()));
        movie.setDurationMins(request.getDurationMins());
        movie.setPosterUrl(request.getPosterUrl());
        movie.set3D(request.is3D());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setEndDate(request.getEndDate());
        return movieRepository.save(movie);
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findByIsActiveTrue();
    }

    public Movie getMovie(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }
}