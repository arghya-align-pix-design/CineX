package com.cinex.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinex.dto.TheatreRequest;
import com.cinex.entity.Section;
import com.cinex.entity.Theatre;
import com.cinex.entity.User;
import com.cinex.repository.TheatreRepository;
import com.cinex.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class TheatreServiceTest {

    @Mock
    private TheatreRepository theatreRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TheatreService theatreService;

    private User vendor;
    private Theatre theatre;
    private String vendorEmail = "vendor@test.com";

    @BeforeEach
    public void setup() {
        vendor = new User();
        vendor.setId(10L);
        vendor.setEmail(vendorEmail);

        theatre = new Theatre();
        theatre.setId(100L);
        theatre.setName("Rex");
        theatre.setVendor(vendor);

        Section sec1 = new Section();
        sec1.setId(1L);
        sec1.setName("VIP");
        sec1.setActive(true);

        Section sec2 = new Section();
        sec2.setId(2L);
        sec2.setName("Silver");
        sec2.setActive(false);

        List<Section> sections = new ArrayList<>(Arrays.asList(sec1, sec2));
        theatre.setSections(sections);
    }

    @Test
    public void testCreateTheatre_Success() {
        TheatreRequest request = new TheatreRequest();
        request.setName("Inox");
        request.setCity("Delhi");
        request.setOpenTime(LocalTime.of(9, 0));
        request.setCloseTime(LocalTime.of(23, 0));

        when(userRepository.findByEmail(vendorEmail)).thenReturn(Optional.of(vendor));
        when(theatreRepository.save(any(Theatre.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Theatre created = theatreService.createTheatre(request, vendorEmail);

        assertNotNull(created);
        assertEquals("Inox", created.getName());
        assertEquals("Delhi", created.getCity());
        assertEquals(vendor, created.getVendor());
        verify(theatreRepository, times(1)).save(any(Theatre.class));
    }

    @Test
    public void testGetLayout_FiltersInactiveSections() {
        when(theatreRepository.findById(100L)).thenReturn(Optional.of(theatre));

        Theatre result = theatreService.getLayout(100L);

        assertNotNull(result);
        assertEquals(1, result.getSections().size());
        assertEquals("VIP", result.getSections().get(0).getName());
        assertTrue(result.getSections().get(0).isActive());
    }
}
