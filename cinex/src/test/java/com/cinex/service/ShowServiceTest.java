package com.cinex.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinex.dto.SeatGridConfig;
import com.cinex.dto.ShowRequest;
import com.cinex.dto.ShowResponse;
import com.cinex.entity.Movie;
import com.cinex.entity.Section;
import com.cinex.entity.Show;
import com.cinex.entity.Theatre;
import com.cinex.entity.User;
import com.cinex.repository.BookingRepository;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.ScreenRepository;
import com.cinex.repository.SectionRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.TheatreRepository;
import com.cinex.exception.ForbiddenException;

@ExtendWith(MockitoExtension.class)
public class ShowServiceTest {

    @Mock
    private ShowRepository showRepository;

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private TheatreRepository theatreRepository;

    @Mock
    private SectionRepository sectionRepository;

    @Mock
    private ScreenRepository screenRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private SeatLockService seatLockService;

    @InjectMocks
    private ShowService showService;

    private Movie movie;
    private Theatre theatre;
    private Section section;
    private User vendor;

    @BeforeEach
    public void setup() {
        vendor = new User();
        vendor.setId(2L);
        vendor.setEmail("vendor@test.com");

        movie = new Movie();
        movie.setId(1L);
        movie.setTitle("Interstellar");

        theatre = new Theatre();
        theatre.setId(1L);
        theatre.setName("PVR");
        theatre.setVendor(vendor);
        theatre.setCity("Mumbai");

        section = new Section();
        section.setId(1L);
        section.setName("Gold");
        section.setRows(5);
        section.setCols(10);
        section.setSeatType(Section.SeatType.GOLD);
        SeatGridConfig grid = new SeatGridConfig();
        grid.setSeatCodes(Arrays.asList("A1", "A2"));
        section.setSeatGrid(grid);
    }

    @Test
    public void testCreateShow_Success() {
        ShowRequest request = new ShowRequest();
        request.setMovieId(1L);
        request.setTheatreId(1L);
        request.setSectionId(1L);
        request.setShowDate(LocalDate.now());
        request.setShowTime(LocalTime.of(20, 0));
        request.setBasePrice(300.0);

        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie));
        when(theatreRepository.findById(1L)).thenReturn(Optional.of(theatre));
        when(sectionRepository.findById(1L)).thenReturn(Optional.of(section));
        when(showRepository.save(any(Show.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Show created = showService.createShow(request, "vendor@test.com");

        assertNotNull(created);
        assertEquals(movie, created.getMovie());
        assertEquals(theatre, created.getTheatre());
        assertEquals(section, created.getSection());
        assertEquals(50, created.getTotalSeats());
        verify(showRepository, times(1)).save(any(Show.class));
    }

    @Test
    public void testCreateShow_Forbidden() {
        ShowRequest request = new ShowRequest();
        request.setMovieId(1L);
        request.setTheatreId(1L);
        request.setSectionId(1L);

        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie));
        when(theatreRepository.findById(1L)).thenReturn(Optional.of(theatre));

        assertThrows(ForbiddenException.class, () -> {
            showService.createShow(request, "unauthorized@test.com");
        });
    }

    @Test
    public void testSearchShows() {
        Show showInstance = new Show();
        showInstance.setId(5L);
        showInstance.setMovie(movie);
        showInstance.setTheatre(theatre);
        showInstance.setSection(section);
        showInstance.setShowDate(LocalDate.now());
        showInstance.setShowTime(LocalTime.of(15, 0));
        showInstance.setBasePrice(200.0);
        showInstance.setTotalSeats(100);
        showInstance.setBookedSeats(10);
        showInstance.setStatus(Show.ShowStatus.UPCOMING);

        when(showRepository.findByTheatreCityAndShowDate("Mumbai", LocalDate.now()))
                .thenReturn(Collections.singletonList(showInstance));

        List<ShowResponse> results = showService.searchShows("Mumbai", LocalDate.now(), null);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Interstellar", results.get(0).getMovieTitle());
        assertEquals("PVR", results.get(0).getTheatreName());
    }
}
