package com.cinex.service;

import com.cinex.dto.BookingResponse;
import com.cinex.dto.PaymentOrderResponse;
import com.cinex.dto.PaymentVerifyRequest;
import com.cinex.entity.Booking;
import com.cinex.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Formatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    private static final String MOCK_SECRET = "mock_secret_key_98765";
    private static final String MOCK_KEY_ID = "rzp_test_mockKey123";

    @Transactional
    public PaymentOrderResponse createMockOrder(String bookingRef, String userEmail) {
        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Booking is not in PENDING state");
        }

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: Booking does not belong to user");
        }

        // Generate a mock Razorpay Order ID (e.g. order_mock_abc123)
        String mockOrderId = "order_mock_" + UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 14);

        booking.setRazorpayOrderId(mockOrderId);
        bookingRepository.save(booking);

        PaymentOrderResponse response = new PaymentOrderResponse();
        response.setKey(MOCK_KEY_ID);
        response.setOrderId(mockOrderId);
        response.setAmount(booking.getTotalPrice() * 100); // Razorpay amount is in paise
        response.setCurrency("INR");
        response.setBookingRef(bookingRef);

        return response;
    }

    @Transactional
    public BookingResponse verifyMockPayment(PaymentVerifyRequest request) {
        Booking booking = bookingRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Booking not found for order ID: " + request.getRazorpayOrderId()));

        // Perform signature verification
        String message = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        String expectedSignature = calculateHmacSha256(message, MOCK_SECRET);

        if (!expectedSignature.equalsIgnoreCase(request.getRazorpaySignature())) {
            throw new RuntimeException("Invalid payment signature");
        }

        // If verification matches, confirm the booking
        return bookingService.confirmBooking(booking.getBookingRef());
    }

    private String calculateHmacSha256(String data, String secret) {
        try {
            SecretKeySpec signingKey = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(signingKey);
            byte[] rawHmac = mac.doFinal(data.getBytes());
            try (Formatter formatter = new Formatter()) {
                for (byte b : rawHmac) {
                    formatter.format("%02x", b);
                }
                return formatter.toString();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC-SHA256 signature", e);
        }
    }
}
