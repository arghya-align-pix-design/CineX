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
import org.springframework.transaction.annotation.Transactional;
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

    @Transactional
    public BookingResponse initiateBooking(BookingInitiateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Show show = showRepository.findById(request.getShowId())
                .orElseThrow(() -> new RuntimeException("Show not found"));

        if (request.getSeatCodes().size() > 8) {
            throw new RuntimeException("Cannot book more than 8 seats at once");
        }

        // ── DUAL-LOCK STEP 1: Postgres check (inner lock / source of truth) ──
        // Reject if any seat already has a CONFIRMED or PENDING booking in the database.
        // This catches bypass attempts where someone calls the API after a Redis lock expired.
        boolean seatsAlreadyTaken = bookingRepository.existsConfirmedOrPendingBookingForSeats(
            show.getId(), request.getSeatCodes()
        );
        if (seatsAlreadyTaken) {
            throw new RuntimeException("One or more seats are already booked or held by another user");
        }

        // ── DUAL-LOCK STEP 2: Redis lock (outer lock / fast race-condition guard) ──
        // Prevents two users from passing the Postgres check simultaneously
        // and both succeeding. Redis SETNX is atomic — only one wins.
        List<String> locked = seatLockService.lockSeats(
            show.getId(), 
            request.getSeatCodes(), 
            userEmail
        );

        if (locked == null) {
            throw new RuntimeException("One or more seats already locked by another user");
        }

        try {
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
        } catch (Exception e) {
            // DB save failed — release all Redis locks so seats don't stay locked
            locked.forEach(seat -> seatLockService.unlockSeat(show.getId(), seat));
            throw e;
        }
    }

    @Transactional
    public BookingResponse confirmBooking(String bookingRef) {
        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Booking is not in PENDING state");
        }

        // ── DUAL-LOCK RELEASE (SUCCESS): Postgres first, then Redis ──
        // Step 1: Upgrade Postgres lock from PENDING → CONFIRMED (permanent ownership)
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        Show show = booking.getShow();
        show.setBookedSeats(show.getBookedSeats() + booking.getSeatCodes().size());
        showRepository.save(show);
        bookingRepository.save(booking);

        // Step 2: Release Redis locks AFTER Postgres commit succeeds.
        // Even if app crashes here, seats just appear as IN_CHECKOUT briefly
        // until the 8-min Redis TTL expires naturally. No double-booking risk.
        booking.getSeatCodes().forEach(seat ->
            seatLockService.unlockSeat(show.getId(), seat)
        );

        return toResponse(booking);
    }

    public List<BookingResponse> getMyBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserId(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // Runs every 2 minutes — cancels expired PENDING bookings (8-min TTL)
    @Scheduled(fixedRate = 120000)
    @Transactional
    public void cancelExpiredBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(8);
        List<Booking> expired = bookingRepository.findByStatusAndCreatedAtBefore(
            Booking.BookingStatus.PENDING, cutoff
        );
        expired.forEach(booking -> {
            // ── DUAL-LOCK RELEASE (ABANDONMENT): Postgres first, then Redis ──
            // Step 1: Cancel in Postgres (source of truth freed)
            booking.setStatus(Booking.BookingStatus.CANCELLED);
            bookingRepository.save(booking);

            // Step 2: Release Redis locks AFTER Postgres cancellation is committed.
            // Safe direction: if crash happens here, seats stay "locked" in Redis
            // briefly until TTL expires. No double-booking risk.
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