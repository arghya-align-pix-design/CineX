package com.cinex.service;

import com.cinex.dto.MovieRequest;
import com.cinex.dto.MovieAdminResponse;
import com.cinex.entity.Movie;
import com.cinex.entity.MovieImage;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final BookingRepository bookingRepository;

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
        movie.setProducer(request.getProducer());
        movie.setDirector(request.getDirector());
        movie.setActors(request.getActors());

        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                MovieImage img = new MovieImage();
                img.setMovie(movie);
                img.setImageUrl(url);
                movie.getImages().add(img);
            }
        }

        return movieRepository.save(movie);
    }

    public Movie updateMovie(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setGenre(Movie.Genre.valueOf(request.getGenre().toUpperCase()));
        movie.setLanguage(Movie.Language.valueOf(request.getLanguage().toUpperCase()));
        movie.setDurationMins(request.getDurationMins());
        movie.setPosterUrl(request.getPosterUrl());
        movie.set3D(request.is3D());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setEndDate(request.getEndDate());
        movie.setProducer(request.getProducer());
        movie.setDirector(request.getDirector());
        movie.setActors(request.getActors());

        // Clear existing images and rebuild
        movie.getImages().clear();
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                MovieImage img = new MovieImage();
                img.setMovie(movie);
                img.setImageUrl(url);
                movie.getImages().add(img);
            }
        }

        return movieRepository.save(movie);
    }

    public Movie toggleMovieActive(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        movie.setActive(!movie.isActive());
        return movieRepository.save(movie);
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findByIsActiveTrue();
    }

    public List<Movie> getAllMoviesIncludingInactive() {
        return movieRepository.findAll();
    }

    public List<MovieAdminResponse> getAllMoviesWithStats() {
        List<Movie> movies = movieRepository.findAll();
        return movies.stream().map(movie -> {
            long viewers = bookingRepository.countViewersByMovieId(movie.getId());
            double revenue = bookingRepository.sumRevenueByMovieId(movie.getId());
            
            MovieAdminResponse res = new MovieAdminResponse();
            res.setId(movie.getId());
            res.setTitle(movie.getTitle());
            res.setDescription(movie.getDescription());
            res.setGenre(movie.getGenre() != null ? movie.getGenre().name() : null);
            res.setLanguage(movie.getLanguage() != null ? movie.getLanguage().name() : null);
            res.setDurationMins(movie.getDurationMins());
            res.setPosterUrl(movie.getPosterUrl());
            res.set3D(movie.is3D());
            res.setReleaseDate(movie.getReleaseDate());
            res.setEndDate(movie.getEndDate());
            res.setDirector(movie.getDirector());
            res.setActors(movie.getActors());
            res.setProducer(movie.getProducer());
            res.setActive(movie.isActive());
            res.setTotalViewers(viewers);
            res.setTotalRevenue(revenue);
            res.setImageUrls(movie.getImages().stream().map(img -> img.getImageUrl()).toList());
            return res;
        }).toList();
    }

    public Movie getMovie(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }
}