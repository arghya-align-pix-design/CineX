package com.cinex.service;

import com.cinex.dto.MovieRequest;
import com.cinex.dto.MovieAdminResponse;
import com.cinex.entity.AuditAction;
import com.cinex.entity.Movie;
import com.cinex.entity.MovieImage;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final BookingRepository bookingRepository;
    private final AuditService auditService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoExpireMovies() {
        LocalDate today = LocalDate.now();
        List<Movie> activeMovies = movieRepository.findByIsActiveTrue();
        for (Movie m : activeMovies) {
            if (m.getEndDate() != null && m.getEndDate().isBefore(today)) {
                m.setActive(false);
                movieRepository.save(m);
                auditService.log(AuditAction.MOVIE_TOGGLED, "SYSTEM_AUTO_EXPIRE", "MOVIE",
                        m.getTitle(), "Movie '" + m.getTitle() + "' auto-expired (endDate: " + m.getEndDate() + ")");
            }
        }
    }

    public Movie createMovie(MovieRequest request) {
        return createMovie(request, "ADMIN");
    }

    public Movie updateMovie(Long id, MovieRequest request) {
        return updateMovie(id, request, "ADMIN");
    }

    public Movie toggleMovieActive(Long id) {
        return toggleMovieActive(id, "ADMIN");
    }

    public Movie createMovie(MovieRequest request, String actorEmail) {
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

        Movie saved = movieRepository.save(movie);
        auditService.log(AuditAction.MOVIE_CREATED, actorEmail != null ? actorEmail : "ADMIN", "MOVIE",
                saved.getTitle(), "Movie '" + saved.getTitle() + "' created in catalog");
        return saved;
    }

    public Movie updateMovie(Long id, MovieRequest request, String actorEmail) {
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

        Movie saved = movieRepository.save(movie);
        auditService.log(AuditAction.MOVIE_UPDATED, actorEmail != null ? actorEmail : "ADMIN", "MOVIE",
                saved.getTitle(), "Movie '" + saved.getTitle() + "' details updated");
        return saved;
    }

    public Movie toggleMovieActive(Long id, String actorEmail) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        boolean newActive = !movie.isActive();
        movie.setActive(newActive);

        // If re-activating a movie whose endDate has passed, extend its endDate by 30 days for public interest re-run!
        if (newActive && movie.getEndDate() != null && movie.getEndDate().isBefore(LocalDate.now())) {
            movie.setEndDate(LocalDate.now().plusDays(30));
        }

        Movie saved = movieRepository.save(movie);
        auditService.log(AuditAction.MOVIE_TOGGLED, actorEmail != null ? actorEmail : "ADMIN", "MOVIE",
                saved.getTitle(), "Movie '" + saved.getTitle() + "' set to " + (saved.isActive() ? "ACTIVE (Public Interest Re-run)" : "INACTIVE"));
        return saved;
    }

    public List<Movie> getAllMovies() {
        LocalDate today = LocalDate.now();
        List<Movie> active = movieRepository.findByIsActiveTrue();
        return active.stream()
                .filter(m -> m.getEndDate() == null || !m.getEndDate().isBefore(today))
                .toList();
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