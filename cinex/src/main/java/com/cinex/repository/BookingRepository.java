package com.cinex.repository;

import com.cinex.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    Optional<Booking> findByBookingRef(String bookingRef);
    List<Booking> findByStatusAndCreatedAtBefore(
        Booking.BookingStatus status, 
        LocalDateTime cutoff
    );
}