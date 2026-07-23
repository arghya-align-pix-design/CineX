package com.cinex.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinex.entity.Screen;

public interface ScreenRepository extends JpaRepository<Screen, Long> {

    List<Screen> findByTheatreIdAndIsActiveTrue(Long theatreId);

    List<Screen> findByTheatreId(Long theatreId);

    boolean existsByTheatreIdAndName(Long theatreId, String name);

    long countByTheatreIdAndIsActiveTrue(Long theatreId);
}
