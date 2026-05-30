package com.cinex.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinex.entity.Movie;

public interface MovieRepository  extends JpaRepository<Movie, Long>{
    List<Movie> findByIsActiveTrue();
}
