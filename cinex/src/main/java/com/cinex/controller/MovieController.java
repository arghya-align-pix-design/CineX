package com.cinex.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinex.dto.MovieRequest;
import com.cinex.entity.Movie;
import com.cinex.service.MovieService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @PostMapping
    //@PreAuthorize("hasRole('ADMIN')")
    public Movie createMovie(@RequestBody MovieRequest request) {
        return movieService.createMovie(request);
    }

    @GetMapping
    public List<Movie> getAllMovies() {
        return movieService.getAllMovies();
    }

    @GetMapping("/{id}")
    public Movie getMovie(@PathVariable Long id) {
        return movieService.getMovie(id);
    }
}