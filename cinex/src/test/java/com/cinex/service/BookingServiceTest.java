package com.cinex.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinex.dto.BookingInitiateRequest;
import com.cinex.dto.BookingResponse;
import com.cinex.entity.Booking;
import com.cinex.entity.Movie;
import com.cinex.entity.Show;
import com.cinex.entity.Theatre;
import com.cinex.entity.User;
import com.cinex.exception.SeatConflictException;
import com.cinex.repository.BookingRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ShowRepository showRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SeatLockService seatLockService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BookingService bookingService;

    private User user;
    private Show show;
    private Booking booking;
    private String userEmail = "consumer@test.com";

    @BeforeEach
    public void setup() {
        user = new User();
        user.setId(1L);
        user.setEmail(userEmail);

        Movie movie = new Movie();
        movie.setTitle("Inception");

        Theatre theatre = new Theatre();
        theatre.setName("Cinepolis");

        show = new Show();
        show.setId(10L);
        show.setMovie(movie);
        show.setTheatre(theatre);
        show.setBasePrice(250.0);
        show.setShowDate(LocalDate.now());
        show.setShowTime(LocalTime.of(18, 0));
        show.setBookedSeats(0);

        booking = new Booking();
        booking.setId(100L);
        booking.setBookingRef("CX-TESTREF12345");
        booking.setUser(user);
        booking.setShow(show);
        booking.setSeatCodes(Arrays.asList("A1", "A2"));
        booking.setTotalPrice(500.0);
        booking.setStatus(Booking.BookingStatus.PENDING);
    }

    @Test
    public void testInitiateBooking_Success() {
        BookingInitiateRequest request = new BookingInitiateRequest();
        request.setShowId(10L);
        request.setSeatCodes(Arrays.asList("A1", "A2"));

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        // Redis lock succeeds
        when(seatLockService.lockSeats(eq(10L), eq(request.getSeatCodes()), eq(userEmail)))
                .thenReturn(request.getSeatCodes());
        // Pessimistic lock on Show returns the show
        when(showRepository.findByIdWithLock(10L)).thenReturn(Optional.of(show));
        // Postgres re-check passes (no existing bookings)
        when(bookingRepository.existsConfirmedOrPendingBookingForSeats(eq(10L), eq(request.getSeatCodes())))
                .thenReturn(false);

        BookingResponse response = bookingService.initiateBooking(request, userEmail);

        assertNotNull(response);
        assertEquals(500.0, response.getTotalPrice());
        assertEquals("PENDING", response.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
        // Verify pessimistic lock was used (not regular findById)
        verify(showRepository, times(1)).findByIdWithLock(10L);
        verify(showRepository, never()).findById(10L);
    }

    @Test
    public void testInitiateBooking_UserNotFound() {
        BookingInitiateRequest request = new BookingInitiateRequest();
        request.setShowId(10L);
        request.setSeatCodes(Arrays.asList("A1", "A2"));

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            bookingService.initiateBooking(request, userEmail);
        });
    }

    @Test
    public void testInitiateBooking_RedisLockFails() {
        BookingInitiateRequest request = new BookingInitiateRequest();
        request.setShowId(10L);
        request.setSeatCodes(Arrays.asList("A1", "A2"));

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        // Redis lock fails — seats already locked by another user
        when(seatLockService.lockSeats(eq(10L), eq(request.getSeatCodes()), eq(userEmail)))
                .thenReturn(null);

        SeatConflictException ex = assertThrows(SeatConflictException.class, () -> {
            bookingService.initiateBooking(request, userEmail);
        });
        assertTrue(ex.getMessage().contains("locked by another user"));
        // Verify we never even touched the database
        verify(showRepository, never()).findByIdWithLock(anyLong());
    }

    @Test
    public void testInitiateBooking_PostgresReCheckFails() {
        // Scenario: Redis lock succeeds, but Postgres re-check finds existing booking.
        // This catches the edge case where a Redis lock expired but the DB booking still exists.
        BookingInitiateRequest request = new BookingInitiateRequest();
        request.setShowId(10L);
        request.setSeatCodes(Arrays.asList("A1", "A2"));

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(seatLockService.lockSeats(eq(10L), eq(request.getSeatCodes()), eq(userEmail)))
                .thenReturn(request.getSeatCodes());
        when(showRepository.findByIdWithLock(10L)).thenReturn(Optional.of(show));
        // Postgres says seats are already taken!
        when(bookingRepository.existsConfirmedOrPendingBookingForSeats(eq(10L), eq(request.getSeatCodes())))
                .thenReturn(true);

        SeatConflictException ex = assertThrows(SeatConflictException.class, () -> {
            bookingService.initiateBooking(request, userEmail);
        });
        assertTrue(ex.getMessage().contains("already booked"));

        // Verify Redis locks were released after the conflict
        verify(seatLockService).unlockSeat(10L, "A1");
        verify(seatLockService).unlockSeat(10L, "A2");
    }

    @Test
    public void testConfirmBooking_Success() {
        // confirmBooking now uses pessimistic-locked queries
        when(bookingRepository.findByBookingRefWithLock("CX-TESTREF12345"))
                .thenReturn(Optional.of(booking));
        when(showRepository.findByIdWithLock(10L)).thenReturn(Optional.of(show));

        BookingResponse response = bookingService.confirmBooking("CX-TESTREF12345");

        assertNotNull(response);
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals(2, show.getBookedSeats());
        verify(bookingRepository, times(1)).save(booking);
        verify(showRepository, times(1)).save(show);
        // Verify pessimistic locks were used
        verify(bookingRepository, times(1)).findByBookingRefWithLock("CX-TESTREF12345");
        verify(showRepository, times(1)).findByIdWithLock(10L);
        verify(seatLockService, times(1)).unlockSeat(10L, "A1");
        verify(seatLockService, times(1)).unlockSeat(10L, "A2");
    }

    @Test
    public void testConfirmBooking_AlreadyConfirmed() {
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        when(bookingRepository.findByBookingRefWithLock("CX-TESTREF12345"))
                .thenReturn(Optional.of(booking));

        assertThrows(RuntimeException.class, () -> {
            bookingService.confirmBooking("CX-TESTREF12345");
        });
    }

    @Test
    public void testCancelExpiredBookings() {
        when(bookingRepository.findByStatusAndCreatedAtBefore(eq(Booking.BookingStatus.PENDING), any()))
                .thenReturn(Collections.singletonList(booking));
        // Pessimistic lock re-fetch
        when(bookingRepository.findByBookingRefWithLock("CX-TESTREF12345"))
                .thenReturn(Optional.of(booking));

        bookingService.cancelExpiredBookings();

        assertEquals(Booking.BookingStatus.CANCELLED, booking.getStatus());
        verify(bookingRepository, times(1)).save(booking);
        verify(seatLockService, times(1)).unlockSeat(10L, "A1");
        verify(seatLockService, times(1)).unlockSeat(10L, "A2");
    }

    @Test
    public void testCancelExpiredBookings_SkipsAlreadyConfirmed() {
        // Scenario: Scheduler finds a PENDING booking, but by the time it acquires
        // the pessimistic lock, the user has already confirmed it.
        Booking racedBooking = new Booking();
        racedBooking.setId(200L);
        racedBooking.setBookingRef("CX-RACED123456");
        racedBooking.setUser(user);
        racedBooking.setShow(show);
        racedBooking.setSeatCodes(Arrays.asList("C1"));
        racedBooking.setTotalPrice(250.0);
        racedBooking.setStatus(Booking.BookingStatus.PENDING);

        when(bookingRepository.findByStatusAndCreatedAtBefore(eq(Booking.BookingStatus.PENDING), any()))
                .thenReturn(Collections.singletonList(racedBooking));

        // By the time we acquire the lock, it's already CONFIRMED
        racedBooking.setStatus(Booking.BookingStatus.CONFIRMED);
        when(bookingRepository.findByBookingRefWithLock("CX-RACED123456"))
                .thenReturn(Optional.of(racedBooking));

        bookingService.cancelExpiredBookings();

        // Should NOT have saved (status stayed CONFIRMED, not overwritten to CANCELLED)
        assertEquals(Booking.BookingStatus.CONFIRMED, racedBooking.getStatus());
        verify(bookingRepository, never()).save(racedBooking);
    }
}
