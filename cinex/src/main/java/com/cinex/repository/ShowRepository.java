package com.cinex.repository;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.cinex.entity.Show;

public interface ShowRepository extends JpaRepository<Show, Long> {
    @Query("SELECT s FROM Show s JOIN FETCH s.theatre JOIN FETCH s.movie WHERE LOWER(s.theatre.city) = LOWER(:city) AND s.isActive = true AND " +
           "((s.endDate IS NULL AND s.showDate = :date) OR (s.endDate IS NOT NULL AND s.showDate <= :date AND s.endDate >= :date))")
    List<Show> findByTheatreCityAndShowDate(@Param("city") String city, @Param("date") LocalDate date);

    @Query("SELECT s FROM Show s JOIN FETCH s.theatre JOIN FETCH s.movie WHERE s.movie.id = :movieId AND s.isActive = true AND " +
           "((s.endDate IS NULL AND s.showDate = :date) OR (s.endDate IS NOT NULL AND s.showDate <= :date AND s.endDate >= :date))")
    List<Show> findByMovieIdAndShowDate(@Param("movieId") Long movieId, @Param("date") LocalDate date);

    @Query("SELECT s FROM Show s JOIN FETCH s.theatre JOIN FETCH s.movie WHERE LOWER(s.theatre.city) = LOWER(:city) AND s.isActive = true")
    List<Show> findByTheatreCityAndIsActiveTrue(@Param("city") String city);

    @Query("SELECT s FROM Show s JOIN FETCH s.theatre JOIN FETCH s.movie WHERE s.movie.id = :movieId AND s.isActive = true")
    List<Show> findByMovieIdAndIsActiveTrue(@Param("movieId") Long movieId);

    List<Show> findByTheatreId(Long theatreId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Show s WHERE s.theatre.id = :theatreId")
    void deleteByTheatreId(@Param("theatreId") Long theatreId);

    @Query("SELECT s FROM Show s WHERE s.theatre.vendor.id = :vendorId ORDER BY s.showDate DESC, s.showTime DESC")
    List<Show> findByVendorId(@Param("vendorId") Long vendorId);

    long countByTheatreVendorId(Long vendorId);

    @Query("SELECT COUNT(s) FROM Show s WHERE s.theatre.vendor.id = :vendorId AND s.status = 'UPCOMING'")
    long countUpcomingByVendorId(@Param("vendorId") Long vendorId);
}
