package com.cinex.dto;

import lombok.Data;

@Data
public class PaymentOrderResponse {
    private String key;
    private String orderId;
    private double amount; // in paise
    private String currency;
    private String bookingRef;
}
