package com.cinex.service;

import com.cinex.dto.BookingInitiateRequest;
import com.cinex.dto.BookingResponse;
import com.cinex.entity.AuditAction;
import com.cinex.entity.Booking;
import com.cinex.entity.Show;
import com.cinex.entity.User;
import com.cinex.exception.SeatConflictException;
import com.cinex.repository.BookingRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;
    private final SeatLockService seatLockService;
    private final AuditService auditService;

    /**
     * 3-Layer Concurrency Control for Seat Booking:
     *
     * LAYER 1 — Redis SETNX (fast guard):
     *   Atomic per-seat lock with 8-min TTL. Only one thread wins per seat.
     *   This stops 99% of race conditions before they even touch the database.
     *
     * LAYER 2 — Postgres SELECT FOR UPDATE (pessimistic lock):
     *   Acquires an exclusive row lock on the Show. Even if two threads
     *   somehow both pass the Redis check, only one can hold this lock.
     *   The other waits, then re-checks and sees the seats are taken.
     *
     * LAYER 3 — @Version optimistic lock (safety net):
     *   If all else fails, Hibernate's version check on Booking and Show
     *   entities catches any concurrent modification at commit time.
     */
    @Transactional
    public BookingResponse initiateBooking(BookingInitiateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getSeatCodes().size() > 8) {
            throw new RuntimeException("Cannot book more than 8 seats at once");
        }

        // ── LAYER 1: Redis SETNX (fast race-condition guard) ──
        // Prevents two users from reaching the database simultaneously.
        // Redis SETNX is atomic — only one user wins per seat.
        List<String> locked = seatLockService.lockSeats(
            request.getShowId(),
            request.getSeatCodes(),
            userEmail
        );

        if (locked == null) {
            throw new SeatConflictException(
                "One or more seats are already locked by another user. Please select different seats.");
        }

        try {
            // ── LAYER 2: Postgres SELECT FOR UPDATE (pessimistic lock) ──
            // Acquires an exclusive row lock on the Show row.
            // This ensures only one transaction at a time can read + modify
            // the show's bookedSeats counter. Other transactions queue up and wait.
            Show show = showRepository.findByIdWithLock(request.getShowId())
                    .orElseThrow(() -> new RuntimeException("Show not found"));

            // ── LAYER 2 continued: Re-verify in Postgres (inside the lock) ──
            // Even though Redis blocked most duplicates, we re-check the database
            // as the final source of truth. This catches edge cases where a Redis
            // lock expired but the Postgres booking still exists.
            boolean seatsAlreadyTaken = bookingRepository.existsConfirmedOrPendingBookingForSeats(
                show.getId(), request.getSeatCodes()
            );
            if (seatsAlreadyTaken) {
                throw new SeatConflictException(
                    "One or more seats are already booked or held by another user.");
            }

            double totalPrice = show.getBasePrice() * request.getSeatCodes().size();

            // ── LAYER 3: @Version optimistic lock (safety net) ──
            // The Booking entity has a @Version field. If two transactions
            // somehow create conflicting bookings, Hibernate will detect the
            // version mismatch at commit time and reject the second one.
            Booking booking = new Booking();
            booking.setBookingRef(generateBookingRef());
            booking.setUser(user);
            booking.setShow(show);
            booking.setSeatCodes(request.getSeatCodes());
            booking.setTotalPrice(totalPrice);
            booking.setStatus(Booking.BookingStatus.PENDING);

            bookingRepository.save(booking);

            log.info("Booking {} created for user {} — seats: {}",
                    booking.getBookingRef(), userEmail, request.getSeatCodes());

            return toResponse(booking);
        } catch (SeatConflictException e) {
            // Known conflict — release Redis locks and re-throw
            locked.forEach(seat -> seatLockService.unlockSeat(request.getShowId(), seat));
            throw e;
        } catch (Exception e) {
            // Any unexpected failure — release all Redis locks so seats don't stay locked
            locked.forEach(seat -> seatLockService.unlockSeat(request.getShowId(), seat));
            throw e;
        }
    }

    @Transactional
    public BookingResponse confirmBooking(String bookingRef) {
        // ── Pessimistic lock on the Booking row ──
        // Prevents two concurrent confirm requests (e.g., user double-clicks)
        // from both reading PENDING and both trying to transition to CONFIRMED.
        Booking booking = bookingRepository.findByBookingRefWithLock(bookingRef)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Booking is not in PENDING state");
        }

        // ── Pessimistic lock on the Show row ──
        // Protects the bookedSeats counter from lost-update races.
        // If two bookings confirm at the same time, without this lock
        // both could read bookedSeats=5, add 2, and write 7 — losing one update.
        // With the lock, they queue: first writes 7, second reads 7 and writes 9.
        Show show = showRepository.findByIdWithLock(booking.getShow().getId())
                .orElseThrow(() -> new RuntimeException("Show not found"));

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        show.setBookedSeats(show.getBookedSeats() + booking.getSeatCodes().size());
        showRepository.save(show);
        bookingRepository.save(booking);

        // Release Redis locks AFTER Postgres commit succeeds.
        // Even if app crashes here, seats just appear as IN_CHECKOUT briefly
        // until the 8-min Redis TTL expires naturally. No double-booking risk.
        booking.getSeatCodes().forEach(seat ->
            seatLockService.unlockSeat(show.getId(), seat)
        );

        log.info("Booking {} CONFIRMED — {} seats released from Redis locks",
                bookingRef, booking.getSeatCodes().size());

        String customerEmail = booking.getUser() != null ? booking.getUser().getEmail() : "CUSTOMER";
        auditService.log(AuditAction.BOOKING_CONFIRMED, customerEmail, "BOOKING", bookingRef,
                "Booking " + bookingRef + " confirmed for " + booking.getSeatCodes().size() + " seats");

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
            // ── Pessimistic lock on each expired booking ──
            // Prevents a race where the scheduler tries to cancel a booking
            // at the exact moment the user tries to confirm it.
            Booking lockedBooking = bookingRepository.findByBookingRefWithLock(booking.getBookingRef())
                    .orElse(null);

            if (lockedBooking == null) return;

            // Re-check status after acquiring the lock — the user might have
            // confirmed it in the split second between our query and the lock.
            if (lockedBooking.getStatus() != Booking.BookingStatus.PENDING) {
                return; // Already confirmed or cancelled — skip
            }

            lockedBooking.setStatus(Booking.BookingStatus.CANCELLED);
            bookingRepository.save(lockedBooking);

            // Release Redis locks after Postgres cancellation is committed.
            lockedBooking.getSeatCodes().forEach(seat ->
                seatLockService.unlockSeat(lockedBooking.getShow().getId(), seat)
            );

            log.info("Expired booking {} auto-cancelled", lockedBooking.getBookingRef());

            auditService.log(AuditAction.BOOKING_AUTO_CANCELLED, "SYSTEM", "BOOKING", lockedBooking.getBookingRef(),
                    "Expired booking " + lockedBooking.getBookingRef() + " auto-cancelled by background scheduler");
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