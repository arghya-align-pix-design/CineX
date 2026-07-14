package com.cinex.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinex.dto.ScreenLayout;
import com.cinex.dto.ScreenRequest;
import com.cinex.entity.Screen;
import com.cinex.entity.Theatre;
import com.cinex.repository.ScreenRepository;
import com.cinex.repository.TheatreRepository;

@ExtendWith(MockitoExtension.class)
public class ScreenServiceTest {

    @Mock
    private ScreenRepository screenRepository;

    @Mock
    private TheatreRepository theatreRepository;

    @InjectMocks
    private ScreenService screenService;

    private Theatre theatre;
    private Screen screen;

    @BeforeEach
    public void setup() {
        theatre = new Theatre();
        theatre.setId(1L);
        theatre.setName("Cinepolis");

        screen = new Screen();
        screen.setId(10L);
        screen.setName("Screen 1");
        screen.setSoundSystem("Dolby Atmos");
        screen.setProjection("IMAX");
        screen.setMaxCapacity(200);
        screen.setTheatre(theatre);
        screen.setActive(true);
    }

    @Test
    public void testCreateScreen_Success() {
        ScreenRequest request = new ScreenRequest();
        request.setName("Screen 2");
        request.setSoundSystem("DTS");
        request.setProjection("3D");
        request.setMaxCapacity(300);

        when(theatreRepository.findById(1L)).thenReturn(Optional.of(theatre));
        when(screenRepository.existsByTheatreIdAndName(1L, "Screen 2")).thenReturn(false);
        when(screenRepository.save(any(Screen.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Screen created = screenService.createScreen(1L, request);

        assertNotNull(created);
        assertEquals("Screen 2", created.getName());
        assertEquals("DTS", created.getSoundSystem());
        assertEquals("3D", created.getProjection());
        assertEquals(300, created.getMaxCapacity());
        assertNull(created.getScreenLayout());
        verify(screenRepository, times(1)).save(any(Screen.class));
    }

    @Test
    public void testCreateScreen_DuplicateName() {
        ScreenRequest request = new ScreenRequest();
        request.setName("Screen 1");

        when(theatreRepository.findById(1L)).thenReturn(Optional.of(theatre));
        when(screenRepository.existsByTheatreIdAndName(1L, "Screen 1")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> {
            screenService.createScreen(1L, request);
        });
    }

    @Test
    public void testSaveLayout_Success() {
        ScreenLayout layout = createValidLayout();

        when(screenRepository.findById(10L)).thenReturn(Optional.of(screen));
        when(screenRepository.save(any(Screen.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Screen saved = screenService.saveLayout(10L, layout);

        assertNotNull(saved);
        assertNotNull(saved.getScreenLayout());
        assertEquals(2, saved.getTotalSeats());
        assertEquals(2, saved.getScreenLayout().getMeta().getTotalActiveSeats());
        verify(screenRepository, times(1)).save(any(Screen.class));
    }

    @Test
    public void testSaveLayout_ExceedCapacity() {
        ScreenLayout layout = createValidLayout(); // 2 seats
        screen.setMaxCapacity(1); // Cap at 1 seat

        when(screenRepository.findById(10L)).thenReturn(Optional.of(screen));

        assertThrows(RuntimeException.class, () -> {
            screenService.saveLayout(10L, layout);
        });
    }

    @Test
    public void testSaveLayout_NoRows() {
        ScreenLayout layout = new ScreenLayout();
        layout.setRows(Collections.emptyList());

        when(screenRepository.findById(10L)).thenReturn(Optional.of(screen));

        assertThrows(RuntimeException.class, () -> {
            screenService.saveLayout(10L, layout);
        });
    }

    @Test
    public void testSaveLayout_DuplicateSeatCodes() {
        ScreenLayout layout = createValidLayout();
        // Force a duplicate seat code
        layout.getRows().get(1).getSeats().get(0).setCode("A1");

        when(screenRepository.findById(10L)).thenReturn(Optional.of(screen));

        assertThrows(RuntimeException.class, () -> {
            screenService.saveLayout(10L, layout);
        });
    }

    @Test
    public void testSaveLayout_UnassignedZoneRow() {
        ScreenLayout layout = createValidLayout();
        layout.getRows().get(0).setZone("UNKNOWN_ZONE");

        when(screenRepository.findById(10L)).thenReturn(Optional.of(screen));

        assertThrows(RuntimeException.class, () -> {
            screenService.saveLayout(10L, layout);
        });
    }

    @Test
    public void testUpdateScreen_Success() {
        ScreenRequest request = new ScreenRequest();
        request.setName("Screen 1 Renovated");
        request.setSoundSystem("Dolby Atmos 7.1");
        request.setProjection("IMAX 3D");
        request.setMaxCapacity(250);

        when(screenRepository.findById(10L)).thenReturn(Optional.of(screen));
        when(screenRepository.existsByTheatreIdAndName(1L, "Screen 1 Renovated")).thenReturn(false);
        when(screenRepository.save(any(Screen.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Screen updated = screenService.updateScreen(10L, request);

        assertNotNull(updated);
        assertEquals("Screen 1 Renovated", updated.getName());
        assertEquals("Dolby Atmos 7.1", updated.getSoundSystem());
        assertEquals("IMAX 3D", updated.getProjection());
        assertEquals(250, updated.getMaxCapacity());
        verify(screenRepository, times(1)).save(any(Screen.class));
    }

    @Test
    public void testDeleteScreen() {
        when(screenRepository.findById(10L)).thenReturn(Optional.of(screen));
        when(screenRepository.save(any(Screen.class))).thenAnswer(invocation -> invocation.getArgument(0));

        screenService.deleteScreen(10L);

        assertFalse(screen.isActive());
        verify(screenRepository, times(1)).save(screen);
    }

    private ScreenLayout createValidLayout() {
        ScreenLayout layout = new ScreenLayout();

        ScreenLayout.Zone zone = new ScreenLayout.Zone();
        zone.setName("Gold");
        zone.setType("GOLD");
        zone.setPriceMultiplier(1.5);
        zone.setColor("#C4A140");
        layout.setZones(Collections.singletonList(zone));

        ScreenLayout.LayoutSeat seat1 = new ScreenLayout.LayoutSeat();
        seat1.setCol(1);
        seat1.setCode("A1");
        seat1.setStatus("ACTIVE");

        ScreenLayout.LayoutRow row1 = new ScreenLayout.LayoutRow();
        row1.setRowLabel("A");
        row1.setRowOrder(0);
        row1.setZone("GOLD");
        row1.setSeats(Collections.singletonList(seat1));

        ScreenLayout.LayoutSeat seat2 = new ScreenLayout.LayoutSeat();
        seat2.setCol(1);
        seat2.setCode("B1");
        seat2.setStatus("ACTIVE");

        ScreenLayout.LayoutRow row2 = new ScreenLayout.LayoutRow();
        row2.setRowLabel("B");
        row2.setRowOrder(1);
        row2.setZone("GOLD");
        row2.setSeats(Collections.singletonList(seat2));

        layout.setRows(Arrays.asList(row1, row2));

        return layout;
    }
}
