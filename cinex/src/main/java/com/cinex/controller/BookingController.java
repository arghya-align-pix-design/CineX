package com.cinex.controller;

import com.cinex.dto.BookingInitiateRequest;
import com.cinex.dto.BookingResponse;
import com.cinex.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('CONSUMER')")
    public BookingResponse initiateBooking(@Valid @RequestBody BookingInitiateRequest request,
                                            Authentication authentication) {
        return bookingService.initiateBooking(request, authentication.getName());
    }

    @PostMapping("/confirm/{bookingRef}")
    @PreAuthorize("hasRole('CONSUMER')")
    public BookingResponse confirmBooking(@PathVariable String bookingRef) {
        return bookingService.confirmBooking(bookingRef);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CONSUMER')")
    public List<BookingResponse> getMyBookings(Authentication authentication) {
        return bookingService.getMyBookings(authentication.getName());
    }
}