package com.cinex.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ShowResponse {
    private Long id;
    private String movieTitle;
    private String theatreName;
    private String city;
    private String sectionName;
    private String seatType;
    private LocalDate showDate;
    private LocalTime showTime;
    private double basePrice;
    private String status;
    private int totalSeats;
    private int bookedSeats;
    private String availability;
}