package com.cinex.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingResponse {
    private Long id;
    private String bookingRef;
    private String movieTitle;
    private String theatreName;
    private String showDate;
    private String showTime;
    private List<String> seatCodes;
    private double totalPrice;
    private String status;
    private LocalDateTime createdAt;
}