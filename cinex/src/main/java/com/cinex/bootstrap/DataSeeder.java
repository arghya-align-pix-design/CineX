package com.cinex.bootstrap;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cinex.dto.ScreenLayout;
import com.cinex.entity.Movie;
import com.cinex.entity.Screen;
import com.cinex.entity.Show;
import com.cinex.entity.Theatre;
import com.cinex.entity.User;
import com.cinex.repository.MovieRepository;
import com.cinex.repository.ScreenRepository;
import com.cinex.repository.ShowRepository;
import com.cinex.repository.TheatreRepository;
import com.cinex.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;
    private final ShowRepository showRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<String> CITIES = Arrays.asList(
        "Agra", "Ahmedabad", "Amritsar", "Bengaluru", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai",
        "Coimbatore", "Dehradun", "Delhi NCR", "Goa", "Gurgaon", "Guwahati", "Hyderabad", "Indore",
        "Jaipur", "Jharkhand", "Kanpur", "Kochi", "Kolkata", "Lucknow", "Madurai", "Mangaluru",
        "Mumbai", "Mysuru", "Nagpur", "Noida", "Patna", "Pune", "Ranchi", "Siliguri",
        "Surat", "Thiruvananthapuram", "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam"
    );

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking if database seeding is required...");

        // 1. Ensure we have at least one vendor user
        User vendor = userRepository.findByEmail("vendor@cinex.com")
                .orElseGet(() -> {
                    log.info("Seeding default vendor vendor@cinex.com");
                    User u = new User();
                    u.setEmail("vendor@cinex.com");
                    u.setPasswordHash(passwordEncoder.encode("demo123"));
                    u.setRole(User.Role.VENDOR);
                    u.setApproved(true);
                    u.setFirstLogin(false);
                    return userRepository.save(u);
                });

        // 2. Fetch movies to link to shows, seed default ones if empty
        List<Movie> movies = movieRepository.findByIsActiveTrue();
        if (movies.isEmpty()) {
            log.info("No active movies found. Seeding default movies...");
            List<Movie> defaultMovies = new ArrayList<>();
            
            Movie m1 = new Movie();
            m1.setTitle("Inception");
            m1.setDescription("A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.");
            m1.setGenre(Movie.Genre.SCIFI);
            m1.setLanguage(Movie.Language.ENGLISH);
            m1.setDurationMins(148);
            m1.setPosterUrl("https://image.tmdb.org/t/p/original/l9Z8Z2D7a72dO2y4X353gXoGZfF.jpg");
            m1.set3D(false);
            m1.setReleaseDate(LocalDate.now().minusMonths(1));
            m1.setEndDate(LocalDate.now().plusMonths(3));
            m1.setActive(true);
            m1.setDirector("Christopher Nolan");
            m1.setActors("Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page");
            defaultMovies.add(m1);

            Movie m2 = new Movie();
            m2.setTitle("Interstellar");
            m2.setDescription("A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.");
            m2.setGenre(Movie.Genre.SCIFI);
            m2.setLanguage(Movie.Language.ENGLISH);
            m2.setDurationMins(169);
            m2.setPosterUrl("https://image.tmdb.org/t/p/original/gEU2QthHGvGo1q7iFjG20h42Rcy.jpg");
            m2.set3D(false);
            m2.setReleaseDate(LocalDate.now().minusMonths(1));
            m2.setEndDate(LocalDate.now().plusMonths(3));
            m2.setActive(true);
            m2.setDirector("Christopher Nolan");
            m2.setActors("Matthew McConaughey, Anne Hathaway, Jessica Chastain");
            defaultMovies.add(m2);

            Movie m3 = new Movie();
            m3.setTitle("The Dark Knight");
            m3.setDescription("When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.");
            m3.setGenre(Movie.Genre.ACTION);
            m3.setLanguage(Movie.Language.ENGLISH);
            m3.setDurationMins(152);
            m3.setPosterUrl("https://image.tmdb.org/t/p/original/qJ2tWGB2Lclm4Vv721n551SR1IB.jpg");
            m3.set3D(false);
            m3.setReleaseDate(LocalDate.now().minusMonths(2));
            m3.setEndDate(LocalDate.now().plusMonths(2));
            m3.setActive(true);
            m3.setDirector("Christopher Nolan");
            m3.setActors("Christian Bale, Heath Ledger, Aaron Eckhart");
            defaultMovies.add(m3);

            Movie m4 = new Movie();
            m4.setTitle("Oppenheimer");
            m4.setDescription("The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.");
            m4.setGenre(Movie.Genre.DRAMA);
            m4.setLanguage(Movie.Language.ENGLISH);
            m4.setDurationMins(180);
            m4.setPosterUrl("https://image.tmdb.org/t/p/original/8Gxv2wSbs87Wg460VkNyYWZJ2Fc.jpg");
            m4.set3D(false);
            m4.setReleaseDate(LocalDate.now().minusMonths(1));
            m4.setEndDate(LocalDate.now().plusMonths(3));
            m4.setActive(true);
            m4.setDirector("Christopher Nolan");
            m4.setActors("Cillian Murphy, Emily Blunt, Matt Damon");
            defaultMovies.add(m4);

            for (Movie m : defaultMovies) {
                movieRepository.save(m);
            }
            movies = movieRepository.findByIsActiveTrue();
        }

        // Wipe old shows, screens, and theatres to build the new "INOX 5-screen per city" structure cleanly
        log.info("Wiping existing shows, screens, and theatres to rebuild a clean INOX multiplex catalog...");
        showRepository.deleteAll();
        screenRepository.deleteAll();
        theatreRepository.deleteAll();

        // 3. For each city, register a new INOX theatre, 5 screens, and 5 shows everyday for a week
        List<LocalTime> chronologicalTimes = Arrays.asList(
            LocalTime.of(9, 30),
            LocalTime.of(12, 45),
            LocalTime.of(16, 0),
            LocalTime.of(19, 15),
            LocalTime.of(22, 30)
        );

        // Standard 5-row layout
        ScreenLayout standardLayout = createStandardLayout();

        for (String city : CITIES) {
            log.info("Seeding INOX Multiplex for city: {}", city);
            Theatre t = new Theatre();
            t.setName("INOX " + city);
            t.setAddressLine("Centrum Mall, Downtown Sector");
            t.setPincode("400001");
            t.setCity(city);
            t.setDistrict(city);
            t.setState("State");
            t.setOpenTime(LocalTime.of(9, 0));
            t.setCloseTime(LocalTime.of(23, 30));
            t.setHasRecliner(true);
            t.setVendor(vendor);
            final Theatre savedTheatre = theatreRepository.save(t);

            // Create exactly 5 screens
            List<Screen> savedScreens = new ArrayList<>();
            for (int sIndex = 1; sIndex <= 5; sIndex++) {
                Screen s = new Screen();
                s.setName("Screen " + sIndex);
                s.setSoundSystem(sIndex == 1 ? "Dolby Atmos" : "DTS Studio");
                s.setProjection(sIndex == 1 ? "IMAX Laser" : "RealD 3D");
                s.setTheatre(savedTheatre);
                s.setTotalSeats(50);
                s.setMaxCapacity(200);
                s.setActive(true);
                s.setScreenLayout(standardLayout);
                savedScreens.add(screenRepository.save(s));
            }

            // Create 5 shows everyday for a week (7 days) for each screen
            List<Show> batchShows = new ArrayList<>();
            for (int dOffset = 0; dOffset < 7; dOffset++) {
                LocalDate showDate = LocalDate.now().plusDays(dOffset);

                for (Screen screen : savedScreens) {
                    for (int sTimeIndex = 0; sTimeIndex < chronologicalTimes.size(); sTimeIndex++) {
                        // Cycle through movies safely using Math.abs
                        int movieIndex = Math.abs((sTimeIndex + dOffset + screen.getName().hashCode()) % movies.size());
                        Movie movie = movies.get(movieIndex);
                        
                        Show show = new Show();
                        show.setMovie(movie);
                        show.setTheatre(savedTheatre);
                        show.setScreen(screen);
                        show.setShowDate(showDate);
                        show.setEndDate(null); // Single-day independent show
                        show.setShowTime(chronologicalTimes.get(sTimeIndex));
                        show.setBasePrice(150.0 + (25.0 * sTimeIndex));
                        show.setTotalSeats(screen.getTotalSeats());
                        show.setBookedSeats(0);
                        show.setStatus(Show.ShowStatus.UPCOMING);
                        show.setActive(true);

                        batchShows.add(show);
                    }
                }
            }
            showRepository.saveAll(batchShows);
        }

        log.info("Database seeding check complete.");
    }

    private ScreenLayout createStandardLayout() {
        ScreenLayout layout = new ScreenLayout();
        List<ScreenLayout.LayoutRow> layoutRows = new ArrayList<>();
        for (int r = 0; r < 5; r++) {
            char rowChar = (char) ('A' + r);
            String rowLabel = String.valueOf(rowChar);
            ScreenLayout.LayoutRow row = new ScreenLayout.LayoutRow();
            row.setRowLabel(rowLabel);
            row.setRowOrder(r);
            row.setZone(r < 2 ? "GOLD" : "SILVER");

            List<ScreenLayout.LayoutSeat> seats = new ArrayList<>();
            for (int c = 1; c <= 10; c++) {
                ScreenLayout.LayoutSeat seat = new ScreenLayout.LayoutSeat();
                seat.setCol(c);
                seat.setCode(rowLabel + c);
                seat.setStatus("ACTIVE");
                seats.add(seat);
            }
            row.setSeats(seats);
            layoutRows.add(row);
        }
        layout.setRows(layoutRows);

        List<ScreenLayout.Zone> zones = new ArrayList<>();
        ScreenLayout.Zone goldZone = new ScreenLayout.Zone();
        goldZone.setName("Gold");
        goldZone.setType("GOLD");
        goldZone.setPriceMultiplier(1.5);
        goldZone.setColor("#E8B84B");
        zones.add(goldZone);

        ScreenLayout.Zone silverZone = new ScreenLayout.Zone();
        silverZone.setName("Silver");
        silverZone.setType("SILVER");
        silverZone.setPriceMultiplier(1.0);
        silverZone.setColor("#CCCCCC");
        zones.add(silverZone);

        layout.setZones(zones);

        ScreenLayout.LayoutMeta meta = new ScreenLayout.LayoutMeta();
        meta.setMaxCols(10);
        meta.setTotalActiveSeats(50);
        layout.setMeta(meta);

        return layout;
    }
}
