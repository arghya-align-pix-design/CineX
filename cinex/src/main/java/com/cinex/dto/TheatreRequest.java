package com.cinex.dto;

import java.time.LocalTime;

import lombok.Data;

@Data
public class TheatreRequest {
    private String name;
    private String addressLine;
    private String pincode;
    private String city;
    private String district;
    private String state;
    private LocalTime openTime;
    private LocalTime closeTime;
    private boolean hasRecliner;
}
