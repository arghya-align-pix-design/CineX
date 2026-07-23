package com.cinex.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class PaymentVerifyRequest {
    @NotBlank(message = "Order ID is required")
    private String razorpayOrderId;

    @NotBlank(message = "Payment ID is required")
    private String razorpayPaymentId;

    @NotBlank(message = "Signature is required")
    private String razorpaySignature;
}
