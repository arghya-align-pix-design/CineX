package com.cinex.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cinex.dto.ShowRequest;
import com.cinex.dto.ShowResponse;
import com.cinex.entity.Movie;
import com.cinex.entity.Section;
import com.cinex.entity.Show;
import com.cinex.entity.Theatre;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.SectionRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.TheatreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShowService {
    private final ShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final TheatreRepository theatreRepository;
    private final SeatLockService seatLockService;
    private final SectionRepository sectionRepository;

    public Show createShow(ShowRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Theatre theatre = theatreRepository.findById(request.getTheatreId())
                .orElseThrow(() -> new RuntimeException("Theatre not found"));
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new RuntimeException("Section not found"));

        Show show = new Show();
        show.setMovie(movie);
        show.setTheatre(theatre);
        show.setSection(section);
        show.setShowDate(request.getShowDate());
        show.setShowTime(request.getShowTime());
        show.setBasePrice(request.getBasePrice());
        show.setTotalSeats(section.getRows() * section.getCols());
        show.setBookedSeats(0);
        show.setStatus(Show.ShowStatus.UPCOMING);

         return showRepository.save(show);
    }

    public List<ShowResponse> searchShows(String city, LocalDate date, Long movieId) {
        List<Show> shows;
        if (movieId != null) {
            shows = showRepository.findByMovieIdAndShowDate(movieId, date);
        } else {
            shows = showRepository.findByTheatreCityAndShowDate(city, date);
        }
        return shows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ShowResponse getShowWithSeats(Long showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new RuntimeException("Show not found"));
        return toResponse(show);
    }

    private ShowResponse toResponse(Show show) {
        ShowResponse response = new ShowResponse();
        response.setId(show.getId());
        response.setMovieTitle(show.getMovie().getTitle());
        response.setTheatreName(show.getTheatre().getName());
        response.setCity(show.getTheatre().getCity());
        response.setSectionName(show.getSection().getName());
        response.setSeatType(show.getSection().getSeatType().name());
        response.setShowDate(show.getShowDate());
        response.setShowTime(show.getShowTime());
        response.setBasePrice(show.getBasePrice());
        response.setStatus(show.getStatus().name());
        response.setTotalSeats(show.getTotalSeats());
        response.setBookedSeats(show.getBookedSeats());

        int bookedPct = (show.getBookedSeats() * 100) / show.getTotalSeats();
        if (bookedPct == 100) response.setAvailability("SOLD OUT");
        else if (bookedPct >= 70) response.setAvailability("FAST FILLING");
        else response.setAvailability("AVAILABLE");

        return response;
    }

    public Object getShowSeats(Long showId){
        Show show= showRepository.findById(showId)
            .orElseThrow(() -> new RuntimeException("Show not found!!"));

        List<String> seatCodes = show.getSection().getSeatGrid().getSeatCodes();
        List<String> damaged = show.getSection().getSeatGrid().getDamagedSeats();

        List<java.util.Map<String, String>> seats = seatCodes.stream()
    .filter(code -> damaged == null || !damaged.contains(code))
    .map(code -> {
        java.util.Map<String, String> seat = new java.util.HashMap<>();
        seat.put("seatCode", code);
        if (seatLockService.isLocked(showId, code)) {
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
        "sectionName", show.getSection().getName(),
        "seatType", show.getSection().getSeatType().name(),
        "basePrice", show.getBasePrice(),
        "seats", seats
    );
    }

}
