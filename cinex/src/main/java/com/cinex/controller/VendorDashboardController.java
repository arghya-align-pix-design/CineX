package com.cinex.controller;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinex.dto.VendorStatsResponse;
import com.cinex.entity.Movie;
import com.cinex.entity.Show;
import com.cinex.service.VendorDashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/vendor/dashboard")
@PreAuthorize("hasRole('VENDOR')")
@RequiredArgsConstructor
public class VendorDashboardController {

    private final VendorDashboardService vendorDashboardService;

    @GetMapping("/stats")
    public VendorStatsResponse getStats(Authentication authentication) {
        return vendorDashboardService.getVendorStats(authentication.getName());
    }

    @GetMapping("/shows")
    public List<Show> getShows(Authentication authentication) {
        return vendorDashboardService.getVendorShows(authentication.getName());
    }

    @GetMapping("/movies")
    public List<Movie> getMovies() {
        return vendorDashboardService.getAvailableMovies();
    }
}
