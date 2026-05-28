package com.cinex.service;

import com.cinex.dto.BookingInitiateRequest;
import com.cinex.dto.BookingResponse;
import com.cinex.entity.Booking;
import com.cinex.entity.Show;
import com.cinex.entity.User;
import com.cinex.repository.BookingRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;
    private final SeatLockService seatLockService;

    public BookingResponse initiateBooking(BookingInitiateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Show show = showRepository.findById(request.getShowId())
                .orElseThrow(() -> new RuntimeException("Show not found"));

        if (request.getSeatCodes().size() > 8) {
            throw new RuntimeException("Cannot book more than 8 seats at once");
        }

        // Try to lock all seats in Redis
        List<String> locked = seatLockService.lockSeats(
            show.getId(), 
            request.getSeatCodes(), 
            userEmail
        );

        if (locked == null) {
            throw new RuntimeException("One or more seats already locked by another user");
        }

        double totalPrice = show.getBasePrice() * request.getSeatCodes().size();

        Booking booking = new Booking();
        booking.setBookingRef(generateBookingRef());
        booking.setUser(user);
        booking.setShow(show);
        booking.setSeatCodes(request.getSeatCodes());
        booking.setTotalPrice(totalPrice);
        booking.setStatus(Booking.BookingStatus.PENDING);

        bookingRepository.save(booking);

        return toResponse(booking);
    }

    public BookingResponse confirmBooking(String bookingRef) {
        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Booking is not in PENDING state");
        }

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Release Redis locks
        booking.getSeatCodes().forEach(seat ->
            seatLockService.unlockSeat(booking.getShow().getId(), seat)
        );

        // Update booked seats count on show
        Show show = booking.getShow();
        show.setBookedSeats(show.getBookedSeats() + booking.getSeatCodes().size());
        showRepository.save(show);

        return toResponse(booking);
    }

    public List<BookingResponse> getMyBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserId(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // Runs every 2 minutes — cancels expired PENDING bookings
    @Scheduled(fixedRate = 120000)
    public void cancelExpiredBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(12);
        List<Booking> expired = bookingRepository.findByStatusAndCreatedAtBefore(
            Booking.BookingStatus.PENDING, cutoff
        );
        expired.forEach(booking -> {
            booking.setStatus(Booking.BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            booking.getSeatCodes().forEach(seat ->
                seatLockService.unlockSeat(booking.getShow().getId(), seat)
            );
        });
    }

    private String generateBookingRef() {
        return "CX-" + UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 16)
                .toUpperCase();
    }

    private BookingResponse toResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setBookingRef(booking.getBookingRef());
        response.setMovieTitle(booking.getShow().getMovie().getTitle());
        response.setTheatreName(booking.getShow().getTheatre().getName());
        response.setShowDate(booking.getShow().getShowDate().toString());
        response.setShowTime(booking.getShow().getShowTime().toString());
        response.setSeatCodes(booking.getSeatCodes());
        response.setTotalPrice(booking.getTotalPrice());
        response.setStatus(booking.getStatus().name());
        response.setCreatedAt(booking.getCreatedAt());
        return response;
    }
}