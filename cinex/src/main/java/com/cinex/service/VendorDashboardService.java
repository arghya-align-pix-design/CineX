package com.cinex.service;

import java.util.List;
import org.springframework.stereotype.Service;
import com.cinex.dto.VendorStatsResponse;
import com.cinex.entity.Movie;
import com.cinex.entity.Show;
import com.cinex.entity.User;
import com.cinex.repository.BookingRepository;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.TheatreRepository;
import com.cinex.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VendorDashboardService {

    private final UserRepository userRepository;
    private final TheatreRepository theatreRepository;
    private final ShowRepository showRepository;
    private final BookingRepository bookingRepository;
    private final MovieRepository movieRepository;

    public VendorStatsResponse getVendorStats(String email) {
        User vendor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        long totalTheatres = theatreRepository.countByVendorId(vendor.getId());
        long totalShows = showRepository.countByTheatreVendorId(vendor.getId());
        long upcomingShows = showRepository.countUpcomingByVendorId(vendor.getId());
        long totalBookings = bookingRepository.countConfirmedByVendorId(vendor.getId());
        double totalRevenue = bookingRepository.sumRevenueByVendorId(vendor.getId());

        return new VendorStatsResponse(
            totalTheatres,
            totalShows,
            upcomingShows,
            totalBookings,
            totalRevenue
        );
    }

    public List<Show> getVendorShows(String email) {
        User vendor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        return showRepository.findByVendorId(vendor.getId());
    }

    public List<Movie> getAvailableMovies() {
        return movieRepository.findByIsActiveTrue();
    }
}
