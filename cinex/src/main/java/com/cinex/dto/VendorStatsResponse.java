package com.cinex.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorStatsResponse {
    private long totalTheatres;
    private long totalShows;
    private long upcomingShows;
    private long totalBookings;
    private double totalRevenue;
}
