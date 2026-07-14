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
        when(showRepository.findById(10L)).thenReturn(Optional.of(show));
        when(seatLockService.lockSeats(eq(10L), eq(request.getSeatCodes()), eq(userEmail)))
                .thenReturn(request.getSeatCodes());

        BookingResponse response = bookingService.initiateBooking(request, userEmail);

        assertNotNull(response);
        assertEquals(500.0, response.getTotalPrice());
        assertEquals("PENDING", response.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
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
    public void testInitiateBooking_SeatAlreadyLocked() {
        BookingInitiateRequest request = new BookingInitiateRequest();
        request.setShowId(10L);
        request.setSeatCodes(Arrays.asList("A1", "A2"));

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(showRepository.findById(10L)).thenReturn(Optional.of(show));
        when(seatLockService.lockSeats(eq(10L), eq(request.getSeatCodes()), eq(userEmail)))
                .thenReturn(null);

        assertThrows(RuntimeException.class, () -> {
            bookingService.initiateBooking(request, userEmail);
        });
    }

    @Test
    public void testConfirmBooking_Success() {
        when(bookingRepository.findByBookingRef("CX-TESTREF12345")).thenReturn(Optional.of(booking));

        BookingResponse response = bookingService.confirmBooking("CX-TESTREF12345");

        assertNotNull(response);
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals(2, show.getBookedSeats());
        verify(bookingRepository, times(1)).save(booking);
        verify(showRepository, times(1)).save(show);
        verify(seatLockService, times(1)).unlockSeat(10L, "A1");
        verify(seatLockService, times(1)).unlockSeat(10L, "A2");
    }

    @Test
    public void testConfirmBooking_AlreadyConfirmed() {
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        when(bookingRepository.findByBookingRef("CX-TESTREF12345")).thenReturn(Optional.of(booking));

        assertThrows(RuntimeException.class, () -> {
            bookingService.confirmBooking("CX-TESTREF12345");
        });
    }

    @Test
    public void testCancelExpiredBookings() {
        when(bookingRepository.findByStatusAndCreatedAtBefore(eq(Booking.BookingStatus.PENDING), any()))
                .thenReturn(Collections.singletonList(booking));

        bookingService.cancelExpiredBookings();

        assertEquals(Booking.BookingStatus.CANCELLED, booking.getStatus());
        verify(bookingRepository, times(1)).save(booking);
        verify(seatLockService, times(1)).unlockSeat(10L, "A1");
        verify(seatLockService, times(1)).unlockSeat(10L, "A2");
    }
}
