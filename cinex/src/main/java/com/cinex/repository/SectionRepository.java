package com.cinex.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cinex.entity.Section;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByTheatreId(Long theatreId);
    List<Section> findByTheatreIdAndIsActiveTrue(Long theatreId);
    boolean existsByTheatreIdAndName(Long theatreId, String name);
}
