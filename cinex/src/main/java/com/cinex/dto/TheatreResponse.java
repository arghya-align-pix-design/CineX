package com.cinex.dto;

import java.time.LocalTime;
import java.util.List;

import lombok.Data;

@Data
public class TheatreResponse {
    private Long id;
    private String name;
    private String addressLine;
    private String pincode;
    private String city;
    private String district;
    private String state;
    private LocalTime openTime;
    private LocalTime closeTime;
    private boolean hasRecliner;
    private boolean isActive;
    private List<SectionResponse> sections;
}