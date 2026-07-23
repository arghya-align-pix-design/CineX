package com.cinex.controller;

import com.cinex.dto.BookingResponse;
import com.cinex.dto.PaymentOrderResponse;
import com.cinex.dto.PaymentVerifyRequest;
import com.cinex.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CONSUMER')")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public PaymentOrderResponse createOrder(@RequestParam String bookingRef, Authentication authentication) {
        return paymentService.createMockOrder(bookingRef, authentication.getName());
    }

    @PostMapping("/verify")
    public BookingResponse verifyPayment(@Valid @RequestBody PaymentVerifyRequest request) {
        return paymentService.verifyMockPayment(request);
    }
}
