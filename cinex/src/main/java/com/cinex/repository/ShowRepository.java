package com.cinex.repository;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinex.entity.Show;

public interface ShowRepository extends JpaRepository<Show, Long> {
    List<Show> findByTheatreCityAndShowDate(String city, LocalDate date);
    List<Show> findByMovieIdAndShowDate(Long movieId, LocalDate date);
    List<Show> findByTheatreId(Long theatreId);
}
