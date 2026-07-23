package com.cinex.repository;

import com.cinex.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    Optional<Booking> findByBookingRef(String bookingRef);
    Optional<Booking> findByRazorpayOrderId(String razorpayOrderId);
    List<Booking> findByStatusAndCreatedAtBefore(
        Booking.BookingStatus status, 
        LocalDateTime cutoff
    );
    List<Booking> findByShowIdAndStatus(Long showId, Booking.BookingStatus status);

    @Query("SELECT COUNT(b) > 0 FROM Booking b JOIN b.seatCodes s " +
           "WHERE b.show.id = :showId AND s IN :seatCodes AND (b.status = 'CONFIRMED' OR b.status = 'PENDING')")
    boolean existsConfirmedOrPendingBookingForSeats(@Param("showId") Long showId, @Param("seatCodes") List<String> seatCodes);

    @Modifying
    @Transactional
    @Query("DELETE FROM Booking b WHERE b.show.id = :showId")
    void deleteByShowId(@Param("showId") Long showId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.show.theatre.vendor.id = :vendorId AND b.status = 'CONFIRMED'")
    long countConfirmedByVendorId(@Param("vendorId") Long vendorId);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0.0) FROM Booking b WHERE b.show.theatre.vendor.id = :vendorId AND b.status = 'CONFIRMED'")
    double sumRevenueByVendorId(@Param("vendorId") Long vendorId);

    @Query("SELECT COUNT(s) FROM Booking b JOIN b.seatCodes s WHERE b.show.movie.id = :movieId AND b.status = 'CONFIRMED'")
    long countViewersByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0.0) FROM Booking b WHERE b.show.movie.id = :movieId AND b.status = 'CONFIRMED'")
    double sumRevenueByMovieId(@Param("movieId") Long movieId);
}