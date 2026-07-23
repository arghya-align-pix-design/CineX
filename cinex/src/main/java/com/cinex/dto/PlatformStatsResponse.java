package com.cinex.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlatformStatsResponse {
    private long totalVendors;
    private long activeVendors;
    private long suspendedVendors;
    private long bannedVendors;
    private long totalMovies;
    private long activeMovies;
}
