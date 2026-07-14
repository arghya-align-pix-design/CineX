package com.cinex.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cinex.dto.SeatGridConfig;
import com.cinex.dto.SectionRequest;
import com.cinex.entity.Section;
import com.cinex.entity.Theatre;
import com.cinex.repository.SectionRepository;
import com.cinex.repository.TheatreRepository;

@ExtendWith(MockitoExtension.class)
public class SectionServiceTest {

    @Mock
    private SectionRepository sectionRepository;

    @Mock
    private TheatreRepository theatreRepository;

    @InjectMocks
    private SectionService sectionService;

    private Theatre theatre;
    private Section section;

    @BeforeEach
    public void setup() {
        theatre = new Theatre();
        theatre.setId(1L);
        theatre.setName("Wave");

        section = new Section();
        section.setId(10L);
        section.setName("Executive");
        section.setRows(5);
        section.setCols(6);
        section.setSeatType(Section.SeatType.EXECUTIVE);
        section.setTheatre(theatre);
        section.setActive(true);
        
        SeatGridConfig grid = new SeatGridConfig();
        section.setSeatGrid(grid);
    }

    @Test
    public void testAddSection_Success() {
        SectionRequest request = new SectionRequest();
        request.setName("Premium");
        request.setSeatType("GOLD");
        request.setRows(10);
        request.setCols(10);
        request.setPriceMultiplier(1.5);

        when(theatreRepository.findById(1L)).thenReturn(Optional.of(theatre));
        when(sectionRepository.existsByTheatreIdAndName(1L, "Premium")).thenReturn(false);
        when(sectionRepository.save(any(Section.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Section created = sectionService.addSection(1L, request);

        assertNotNull(created);
        assertEquals("Premium", created.getName());
        assertEquals(Section.SeatType.GOLD, created.getSeatType());
        assertEquals(10, created.getRows());
        assertEquals(10, created.getCols());
        assertEquals(1.5, created.getPriceMultiplier());
        assertEquals(100, created.getSeatGrid().getSeatCodes().size());
        verify(sectionRepository, times(1)).save(any(Section.class));
    }

    @Test
    public void testAddSection_DuplicateName() {
        SectionRequest request = new SectionRequest();
        request.setName("Executive");

        when(theatreRepository.findById(1L)).thenReturn(Optional.of(theatre));
        when(sectionRepository.existsByTheatreIdAndName(1L, "Executive")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> {
            sectionService.addSection(1L, request);
        });
    }

    @Test
    public void testAddSection_ExceedLimit() {
        SectionRequest request = new SectionRequest();
        request.setName("Gigantic");
        request.setRows(26);
        request.setCols(20); // 520 seats (> 500)

        when(theatreRepository.findById(1L)).thenReturn(Optional.of(theatre));

        assertThrows(RuntimeException.class, () -> {
            sectionService.addSection(1L, request);
        });
    }

    @Test
    public void testDeleteSection() {
        when(sectionRepository.findById(10L)).thenReturn(Optional.of(section));

        sectionService.deleteSection(1L, 10L);

        assertFalse(section.isActive());
        verify(sectionRepository, times(1)).save(section);
    }
}
