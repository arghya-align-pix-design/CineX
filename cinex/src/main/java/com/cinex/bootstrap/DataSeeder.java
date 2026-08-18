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

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking database seeding for August 2026 catalog...");

        // 1. Core Users (Vendor & Demo Recruiter)
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

        userRepository.findByEmail("demo@cinex.com")
                .orElseGet(() -> {
                    log.info("Seeding default demo recruiter user demo@cinex.com");
                    User u = new User();
                    u.setEmail("demo@cinex.com");
                    u.setPasswordHash(passwordEncoder.encode("demo123"));
                    u.setRole(User.Role.CONSUMER);
                    u.setApproved(true);
                    u.setFirstLogin(false);
                    return userRepository.save(u);
                });

        // 2. Movies for August 2026
        List<Movie> movies = movieRepository.findAll();
        if (movies.isEmpty()) {
            log.info("Seeding August 2026 movie catalog with expiry dates...");
            List<Movie> defaultMovies = new ArrayList<>();

            // Movie 1: Stree 2 (Expires Aug 25, 2026)
            Movie m1 = new Movie();
            m1.setTitle("Stree 2");
            m1.setDescription("The town of Chanderi is haunted once again, this time by a headless entity 'Sarkata'. Vikrant and his crew must unravel the supernatural mystery.");
            m1.setGenre(Movie.Genre.HORROR);
            m1.setLanguage(Movie.Language.HINDI);
            m1.setDurationMins(149);
            m1.setPosterUrl("https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600");
            m1.set3D(false);
            m1.setReleaseDate(LocalDate.of(2026, 8, 1));
            m1.setEndDate(LocalDate.of(2026, 8, 25)); // Expires Aug 25
            m1.setActive(true);
            m1.setDirector("Amar Kaushik");
            m1.setActors("Rajkummar Rao, Shraddha Kapoor, Pankaj Tripathi");
            m1.setProducer("Maddock Films");
            defaultMovies.add(m1);

            // Movie 2: Kalki 2898 AD (Expires Aug 30, 2026)
            Movie m2 = new Movie();
            m2.setTitle("Kalki 2898 AD");
            m2.setDescription("A modern avatar of Vishnu, believed to have descended to earth to protect the world from evil forces in a dystopian post-apocalyptic future.");
            m2.setGenre(Movie.Genre.SCIFI);
            m2.setLanguage(Movie.Language.TELUGU);
            m2.setDurationMins(181);
            m2.setPosterUrl("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=600");
            m2.set3D(true);
            m2.setReleaseDate(LocalDate.of(2026, 8, 1));
            m2.setEndDate(LocalDate.of(2026, 8, 30)); // Expires Aug 30
            m2.setActive(true);
            m2.setDirector("Nag Ashwin");
            m2.setActors("Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone");
            m2.setProducer("Vyjayanthi Movies");
            defaultMovies.add(m2);

            // Movie 3: Deadpool & Wolverine (Runs through Sept 15)
            Movie m3 = new Movie();
            m3.setTitle("Deadpool & Wolverine");
            m3.setDescription("Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They team up to defeat a common enemy.");
            m3.setGenre(Movie.Genre.ACTION);
            m3.setLanguage(Movie.Language.ENGLISH);
            m3.setDurationMins(128);
            m3.setPosterUrl("https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&q=80&w=600");
            m3.set3D(true);
            m3.setReleaseDate(LocalDate.of(2026, 8, 1));
            m3.setEndDate(LocalDate.of(2026, 9, 15));
            m3.setActive(true);
            m3.setDirector("Shawn Levy");
            m3.setActors("Ryan Reynolds, Hugh Jackman, Emma Corrin");
            m3.setProducer("Marvel Studios");
            defaultMovies.add(m3);

            // Movie 4: Pushpa 2: The Rule (Runs through Sept 30)
            Movie m4 = new Movie();
            m4.setTitle("Pushpa 2: The Rule");
            m4.setDescription("The clash between Pushpa Raj and Bhanwar Singh Shekhawat continues as Pushpa consolidates his syndicate empire across borders.");
            m4.setGenre(Movie.Genre.ACTION);
            m4.setLanguage(Movie.Language.TELUGU);
            m4.setDurationMins(165);
            m4.setPosterUrl("https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600");
            m4.set3D(false);
            m4.setReleaseDate(LocalDate.of(2026, 8, 1));
            m4.setEndDate(LocalDate.of(2026, 9, 30));
            m4.setActive(true);
            m4.setDirector("Sukumar");
            m4.setActors("Allu Arjun, Rashmika Mandanna, Fahadh Faasil");
            m4.setProducer("Mythri Movie Makers");
            defaultMovies.add(m4);

            // Movie 5: Oppenheimer (Special Re-Release, Expires Aug 25, 2026)
            Movie m5 = new Movie();
            m5.setTitle("Oppenheimer (IMAX Re-Release)");
            m5.setDescription("Special public interest re-run of Christopher Nolan's epic biographical thriller documenting the Trinity Test and Manhattan Project.");
            m5.setGenre(Movie.Genre.DRAMA);
            m5.setLanguage(Movie.Language.ENGLISH);
            m5.setDurationMins(180);
            m5.setPosterUrl("https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600");
            m5.set3D(false);
            m5.setReleaseDate(LocalDate.of(2026, 8, 1));
            m5.setEndDate(LocalDate.of(2026, 8, 25)); // Expires Aug 25
            m5.setActive(true);
            m5.setDirector("Christopher Nolan");
            m5.setActors("Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.");
            m5.setProducer("Universal Pictures");
            defaultMovies.add(m5);

            for (Movie m : defaultMovies) {
                movieRepository.save(m);
            }
            movies = movieRepository.findAll();
        }

        // 3. Multi-theatre Multiplexes for Delhi NCR and Hyderabad
        if (theatreRepository.count() == 0) {
            log.info("Seeding Multiplexes in Delhi NCR and Hyderabad for August 2026...");

            ScreenLayout standardLayout = createStandardLayout();
            List<LocalTime> showTimes = Arrays.asList(
                LocalTime.of(9, 30),
                LocalTime.of(12, 45),
                LocalTime.of(16, 0),
                LocalTime.of(19, 15),
                LocalTime.of(22, 30)
            );

            // Theatre specs: Name, City, Address, Pincode
            List<String[]> theatreSpecs = Arrays.asList(
                // Delhi NCR Multiplexes (4 theatres)
                new String[]{"PVR Director's Cut", "Delhi NCR", "Ambience Mall, Vasant Kunj", "110070"},
                new String[]{"INOX Cinema", "Delhi NCR", "Odeon Building, Connaught Place", "110001"},
                new String[]{"Cinepolis Grand", "Delhi NCR", "DLF Avenue Mall, Saket", "110017"},
                new String[]{"Mirage Multiplex", "Delhi NCR", "City Square, Rajouri Garden", "110027"},

                // Hyderabad Multiplexes (4 theatres)
                new String[]{"AMB Cinemas", "Hyderabad", "Sarath City Capital Mall, Gachibowli", "500084"},
                new String[]{"PVR Forum Mall", "Hyderabad", "Forum Sujana Mall, Kukatpally", "500072"},
                new String[]{"Prasads Multiplex", "Hyderabad", "NTR Gardens, Hitech City Road", "500063"},
                new String[]{"Asian CineSquare", "Hyderabad", "Inner Ring Rd, Uppal", "500039"}
            );

            for (String[] spec : theatreSpecs) {
                String tName = spec[0];
                String city = spec[1];
                String address = spec[2];
                String pincode = spec[3];

                log.info("Creating multiplex: {} in {}", tName, city);
                Theatre t = new Theatre();
                t.setName(tName);
                t.setAddressLine(address);
                t.setPincode(pincode);
                t.setCity(city);
                t.setDistrict(city);
                t.setState(city.equals("Delhi NCR") ? "Delhi" : "Telangana");
                t.setOpenTime(LocalTime.of(9, 0));
                t.setCloseTime(LocalTime.of(23, 30));
                t.setHasRecliner(true);
                t.setVendor(vendor);
                Theatre savedTheatre = theatreRepository.save(t);

                // Create 3-4 screens per multiplex
                List<Screen> screens = new ArrayList<>();
                String[] screenTypes = new String[]{"Screen 1 (IMAX)", "Screen 2 (Dolby Atmos)", "Screen 3 (4DX 3D)", "Screen 4 (Gold Class)"};
                for (int i = 0; i < screenTypes.length; i++) {
                    Screen s = new Screen();
                    s.setName(screenTypes[i]);
                    s.setSoundSystem(i == 0 ? "Dolby Atmos 7.1" : "DTS Studio Sound");
                    s.setProjection(i == 0 ? "IMAX Laser 4K" : "RealD 3D Dual");
                    s.setTheatre(savedTheatre);
                    s.setTotalSeats(50);
                    s.setMaxCapacity(200);
                    s.setActive(true);
                    s.setScreenLayout(standardLayout);
                    screens.add(screenRepository.save(s));
                }

                // Schedule shows for the ENTIRE month of August 2026 (August 1 to August 31, 2026)
                List<Show> augustShows = new ArrayList<>();
                for (int day = 1; day <= 31; day++) {
                    LocalDate showDate = LocalDate.of(2026, 8, day);

                    for (int sIdx = 0; sIdx < screens.size(); sIdx++) {
                        Screen screen = screens.get(sIdx);
                        for (int tIdx = 0; tIdx < showTimes.size(); tIdx++) {
                            // Cycle through active movies deterministically
                            int movieIdx = Math.abs((day + sIdx + tIdx) % movies.size());
                            Movie movie = movies.get(movieIdx);

                            Show show = new Show();
                            show.setMovie(movie);
                            show.setTheatre(savedTheatre);
                            show.setScreen(screen);
                            show.setShowDate(showDate);
                            show.setEndDate(movie.getEndDate());
                            show.setShowTime(showTimes.get(tIdx));
                            show.setBasePrice(180.0 + (30.0 * tIdx));
                            show.setTotalSeats(screen.getTotalSeats());
                            show.setBookedSeats(0);
                            show.setStatus(Show.ShowStatus.UPCOMING);
                            show.setActive(true);

                            augustShows.add(show);
                        }
                    }
                }
                showRepository.saveAll(augustShows);
                log.info("Scheduled {} shows for August 2026 at {}", augustShows.size(), tName);
            }
        }

        log.info("Database seeding complete for August 2026 catalog.");
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
        goldZone.setName("Gold Class");
        goldZone.setType("GOLD");
        goldZone.setPriceMultiplier(1.5);
        goldZone.setColor("#E8B84B");
        zones.add(goldZone);

        ScreenLayout.Zone silverZone = new ScreenLayout.Zone();
        silverZone.setName("Silver Standard");
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
