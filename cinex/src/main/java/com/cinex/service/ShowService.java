package com.cinex.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalTime;

import com.cinex.dto.ShowRequest;
import com.cinex.dto.ShowResponse;
import com.cinex.entity.Movie;
import com.cinex.entity.Screen;
import com.cinex.entity.Section;
import com.cinex.entity.Show;
import com.cinex.entity.Theatre;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.ScreenRepository;
import com.cinex.repository.SectionRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.TheatreRepository;
import com.cinex.entity.Booking;
import com.cinex.repository.BookingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShowService {
    private final ShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final TheatreRepository theatreRepository;
    private final SeatLockService seatLockService;
    private final SectionRepository sectionRepository;
    private final ScreenRepository screenRepository;
    private final BookingRepository bookingRepository;

    public Show createShow(ShowRequest request, String vendorEmail) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Theatre theatre = theatreRepository.findById(request.getTheatreId())
                .orElseThrow(() -> new RuntimeException("Theatre not found"));

        // Verify the vendor owns this theatre
        if (!theatre.getVendor().getEmail().equals(vendorEmail)) {
            throw new com.cinex.exception.ForbiddenException(
                "You do not have permission to schedule shows in this theatre");
        }

        // Must provide either sectionId (legacy) or screenId (new flow)
        if (request.getSectionId() == null && request.getScreenId() == null) {
            throw new RuntimeException("Either sectionId or screenId is required");
        }

        Show show = new Show();
        show.setMovie(movie);
        show.setTheatre(theatre);
        show.setShowDate(request.getShowDate());
        show.setEndDate(request.getEndDate());
        show.setShowTime(request.getShowTime());
        show.setBasePrice(request.getBasePrice());
        show.setBookedSeats(0);
        show.setStatus(Show.ShowStatus.UPCOMING);

        if (request.getScreenId() != null) {
            // New screen-based flow
            Screen screen = screenRepository.findById(request.getScreenId())
                    .orElseThrow(() -> new RuntimeException("Screen not found"));
            show.setScreen(screen);
            show.setTotalSeats(screen.getTotalSeats());
        } else {
            // Legacy section-based flow
            Section section = sectionRepository.findById(request.getSectionId())
                    .orElseThrow(() -> new RuntimeException("Section not found"));
            show.setSection(section);
            show.setTotalSeats(section.getRows() * section.getCols());
        }

         return showRepository.save(show);
    }

    @Transactional(readOnly = true)
    public List<ShowResponse> searchShows(String city, LocalDate date, Long movieId) {
        List<Show> shows;
        if (movieId != null) {
            if (date != null) {
                shows = showRepository.findByMovieIdAndShowDate(movieId, date);
            } else {
                shows = showRepository.findByMovieIdAndIsActiveTrue(movieId);
            }
        } else if (city != null) {
            if (date != null) {
                shows = showRepository.findByTheatreCityAndShowDate(city, date);
            } else {
                shows = showRepository.findByTheatreCityAndIsActiveTrue(city);
            }
        } else {
            shows = showRepository.findAll().stream().filter(Show::isActive).collect(Collectors.toList());
        }
        return shows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShowResponse getShowWithSeats(Long showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new RuntimeException("Show not found"));
        return toResponse(show);
    }

    @Transactional
    public ShowResponse updateShowEndDate(Long showId, LocalDate endDate, String vendorEmail) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new RuntimeException("Show not found"));
        if (!show.getTheatre().getVendor().getEmail().equals(vendorEmail)) {
            throw new com.cinex.exception.ForbiddenException(
                "You do not have permission to edit this show");
        }
        show.setEndDate(endDate);
        return toResponse(showRepository.save(show));
    }

    @Transactional
    public void removeShow(Long showId, String vendorEmail) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new RuntimeException("Show not found"));
        if (!show.getTheatre().getVendor().getEmail().equals(vendorEmail)) {
            throw new com.cinex.exception.ForbiddenException(
                "You do not have permission to remove this show");
        }
        show.setActive(false);
        show.setStatus(Show.ShowStatus.CANCELLED);
        showRepository.save(show);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoExpireShows() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        List<Show> activeShows = showRepository.findAll().stream()
                .filter(s -> s.isActive() && s.getStatus() != Show.ShowStatus.COMPLETED && s.getStatus() != Show.ShowStatus.CANCELLED)
                .toList();

        for (Show s : activeShows) {
            LocalDate end = s.getEndDate() != null ? s.getEndDate() : s.getShowDate();
            if (end.isBefore(today) || (end.isEqual(today) && s.getShowTime().isBefore(now))) {
                s.setStatus(Show.ShowStatus.COMPLETED);
                s.setActive(false);
                showRepository.save(s);
            }
        }
    }

    private ShowResponse toResponse(Show show) {
        ShowResponse response = new ShowResponse();
        response.setId(show.getId());
        response.setMovieId(show.getMovie().getId());
        response.setMovieTitle(show.getMovie().getTitle());
        response.setTheatreName(show.getTheatre().getName());
        response.setCity(show.getTheatre().getCity());
        response.setShowDate(show.getShowDate());
        response.setEndDate(show.getEndDate());
        response.setShowTime(show.getShowTime());
        response.setBasePrice(show.getBasePrice());
        response.setStatus(show.getStatus().name());
        response.setTotalSeats(show.getTotalSeats());
        response.setBookedSeats(show.getBookedSeats());

        // Populate section fields (legacy) or screen fields (new)
        if (show.getSection() != null) {
            response.setSectionName(show.getSection().getName());
            response.setSeatType(show.getSection().getSeatType().name());
        }
        if (show.getScreen() != null) {
            response.setScreenName(show.getScreen().getName());
        }

        int bookedPct = show.getTotalSeats() > 0
                ? (show.getBookedSeats() * 100) / show.getTotalSeats()
                : 0;
        if (bookedPct == 100) response.setAvailability("SOLD OUT");
        else if (bookedPct >= 70) response.setAvailability("FAST FILLING");
        else response.setAvailability("AVAILABLE");

        return response;
    }

    @Transactional(readOnly = true)
    public Object getShowSeats(Long showId){
        Show show= showRepository.findById(showId)
            .orElseThrow(() -> new RuntimeException("Show not found!!"));

        // Screen-based show: derive seats from the ScreenLayout JSONB
        if (show.getScreen() != null && show.getScreen().getScreenLayout() != null) {
            return getScreenBasedSeats(show);
        }

        // Legacy section-based flow
        List<String> seatCodes = show.getSection().getSeatGrid().getSeatCodes();
        List<String> damaged = show.getSection().getSeatGrid().getDamagedSeats();

        List<Booking> confirmedBookings = bookingRepository.findByShowIdAndStatus(showId, Booking.BookingStatus.CONFIRMED);
        java.util.Set<String> bookedSeats = confirmedBookings.stream()
                .flatMap(b -> b.getSeatCodes().stream())
                .collect(Collectors.toSet());

        List<java.util.Map<String, String>> seats = seatCodes.stream()
            .filter(code -> damaged == null || !damaged.contains(code))
            .map(code -> {
                java.util.Map<String, String> seat = new java.util.HashMap<>();
                seat.put("seatCode", code);
                if (bookedSeats.contains(code)) {
                    seat.put("status", "BOOKED");
                } else if (seatLockService.isLocked(showId, code)) {
                    seat.put("status", "IN_CHECKOUT");
                } else {
                    seat.put("status", "AVAILABLE");
                }
                return seat;
            }).collect(Collectors.toList());

    return java.util.Map.of(
        "showId", showId,
        "movieTitle", show.getMovie().getTitle(),
        "showDate", show.getShowDate().toString(),
        "showTime", show.getShowTime().toString(),
        "sectionName", show.getSection() != null ? show.getSection().getName() : "",
        "seatType", show.getSection() != null ? show.getSection().getSeatType().name() : "",
        "basePrice", show.getBasePrice(),
        "seats", seats
    );
    }

    /**
     * Build seat availability from ScreenLayout JSONB for screen-based shows.
     * Returns a richer structure that includes zone info per seat.
     */
    private Object getScreenBasedSeats(Show show) {
        com.cinex.dto.ScreenLayout layout = show.getScreen().getScreenLayout();

        List<Booking> confirmedBookings = bookingRepository.findByShowIdAndStatus(
                show.getId(), Booking.BookingStatus.CONFIRMED);
        java.util.Set<String> bookedSeats = confirmedBookings.stream()
                .flatMap(b -> b.getSeatCodes().stream())
                .collect(Collectors.toSet());

        // Build zone lookup for price multipliers
        java.util.Map<String, Double> zoneMultipliers = new java.util.HashMap<>();
        if (layout.getZones() != null) {
            for (com.cinex.dto.ScreenLayout.Zone zone : layout.getZones()) {
                zoneMultipliers.put(zone.getType(), zone.getPriceMultiplier());
            }
        }

        List<java.util.Map<String, Object>> seats = new java.util.ArrayList<>();
        for (com.cinex.dto.ScreenLayout.LayoutRow row : layout.getRows()) {
            if (row.getSeats() == null) continue;
            for (com.cinex.dto.ScreenLayout.LayoutSeat seat : row.getSeats()) {
                if (!"ACTIVE".equals(seat.getStatus())) continue;

                java.util.Map<String, Object> seatInfo = new java.util.HashMap<>();
                seatInfo.put("seatCode", seat.getCode());
                seatInfo.put("zone", row.getZone());
                seatInfo.put("priceMultiplier", zoneMultipliers.getOrDefault(row.getZone(), 1.0));

                if (bookedSeats.contains(seat.getCode())) {
                    seatInfo.put("status", "BOOKED");
                } else if (seatLockService.isLocked(show.getId(), seat.getCode())) {
                    seatInfo.put("status", "IN_CHECKOUT");
                } else {
                    seatInfo.put("status", "AVAILABLE");
                }
                seats.add(seatInfo);
            }
        }

        return java.util.Map.of(
            "showId", show.getId(),
            "movieTitle", show.getMovie().getTitle(),
            "showDate", show.getShowDate().toString(),
            "showTime", show.getShowTime().toString(),
            "screenName", show.getScreen().getName(),
            "basePrice", show.getBasePrice(),
            "layout", layout,
            "seats", seats
        );
    }

}

