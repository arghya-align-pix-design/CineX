package com.cinex.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.cinex.dto.ScreenLayout;
import com.cinex.dto.ScreenRequest;
import com.cinex.dto.ScreenResponse;
import com.cinex.entity.Screen;
import com.cinex.entity.Theatre;
import com.cinex.repository.ScreenRepository;
import com.cinex.repository.TheatreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScreenService {

    private final ScreenRepository screenRepository;
    private final TheatreRepository theatreRepository;

    // ── Create a new screen (metadata only, no layout yet) ──
    public Screen createScreen(Long theatreId, ScreenRequest request) {
        Theatre theatre = theatreRepository.findById(theatreId)
                .orElseThrow(() -> new RuntimeException("Theatre not found"));

        if (screenRepository.existsByTheatreIdAndName(theatreId, request.getName())) {
            throw new RuntimeException("Screen name already exists in this theatre");
        }

        Screen screen = new Screen();
        screen.setName(request.getName());
        screen.setSoundSystem(request.getSoundSystem());
        screen.setProjection(request.getProjection());
        screen.setMaxCapacity(request.getMaxCapacity());
        screen.setTheatre(theatre);
        // Layout starts as null — vendor designs it via the layout builder
        screen.setScreenLayout(null);
        screen.setTotalSeats(0);

        return screenRepository.save(screen);
    }

    // ── Get all active screens for a theatre ──
    public List<Screen> getScreens(Long theatreId) {
        return screenRepository.findByTheatreIdAndIsActiveTrue(theatreId);
    }

    // ── Get a single screen (with layout) ──
    public Screen getScreen(Long screenId) {
        return screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Screen not found"));
    }

    // ── Save/update the entire layout for a screen ──
    public Screen saveLayout(Long screenId, ScreenLayout layout) {
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Screen not found"));

        validateLayout(layout, screen.getMaxCapacity());

        // Compute totalActiveSeats from the layout
        int totalActive = computeActiveSeats(layout);
        layout.getMeta().setTotalActiveSeats(totalActive);

        screen.setScreenLayout(layout);
        screen.setTotalSeats(totalActive);

        return screenRepository.save(screen);
    }

    // ── Update screen metadata (name, sound, projection, capacity) ──
    public Screen updateScreen(Long screenId, ScreenRequest request) {
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Screen not found"));

        Long theatreId = screen.getTheatre().getId();

        // Duplicate name check (excluding current screen)
        if (!screen.getName().equals(request.getName()) &&
            screenRepository.existsByTheatreIdAndName(theatreId, request.getName())) {
            throw new RuntimeException("Screen name already exists in this theatre");
        }

        screen.setName(request.getName());
        screen.setSoundSystem(request.getSoundSystem());
        screen.setProjection(request.getProjection());
        screen.setMaxCapacity(request.getMaxCapacity());

        return screenRepository.save(screen);
    }

    // ── Soft-delete a screen ──
    public void deleteScreen(Long screenId) {
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Screen not found"));

        screen.setActive(false);
        screenRepository.save(screen);
    }

    // ── Convert entity to response DTO ──
    public ScreenResponse toResponse(Screen screen) {
        ScreenResponse response = new ScreenResponse();
        response.setId(screen.getId());
        response.setName(screen.getName());
        response.setSoundSystem(screen.getSoundSystem());
        response.setProjection(screen.getProjection());
        response.setTotalSeats(screen.getTotalSeats());
        response.setMaxCapacity(screen.getMaxCapacity());
        response.setActive(screen.isActive());
        response.setScreenLayout(screen.getScreenLayout());
        return response;
    }

    // ── Layout Validation ──
    private void validateLayout(ScreenLayout layout, int maxCapacity) {
        if (layout == null) {
            throw new RuntimeException("Layout data is required");
        }

        if (layout.getRows() == null || layout.getRows().isEmpty()) {
            throw new RuntimeException("Layout must have at least one row");
        }

        if (layout.getZones() == null || layout.getZones().isEmpty()) {
            throw new RuntimeException("Layout must have at least one zone defined");
        }

        // Validate total active seats do not exceed max capacity
        int activeSeats = computeActiveSeats(layout);
        if (activeSeats > maxCapacity) {
            throw new RuntimeException(
                "Layout has " + activeSeats + " active seats but screen max capacity is " + maxCapacity);
        }

        if (activeSeats == 0) {
            throw new RuntimeException("Layout must have at least one active seat");
        }

        // Validate no duplicate seat codes
        Set<String> seatCodes = new HashSet<>();
        for (ScreenLayout.LayoutRow row : layout.getRows()) {
            if (row.getSeats() == null) continue;
            for (ScreenLayout.LayoutSeat seat : row.getSeats()) {
                if ("ACTIVE".equals(seat.getStatus())) {
                    if (!seatCodes.add(seat.getCode())) {
                        throw new RuntimeException("Duplicate seat code found: " + seat.getCode());
                    }
                }
            }
        }

        // Validate every row has a zone assigned
        Set<String> zoneTypes = new HashSet<>();
        for (ScreenLayout.Zone zone : layout.getZones()) {
            zoneTypes.add(zone.getType());
            if (zone.getPriceMultiplier() <= 0) {
                throw new RuntimeException("Zone price multiplier must be positive: " + zone.getName());
            }
        }
        for (ScreenLayout.LayoutRow row : layout.getRows()) {
            if (row.getZone() == null || row.getZone().isBlank()) {
                throw new RuntimeException("Row " + row.getRowLabel() + " has no zone assigned");
            }
            if (!zoneTypes.contains(row.getZone())) {
                throw new RuntimeException(
                    "Row " + row.getRowLabel() + " references unknown zone: " + row.getZone());
            }
        }
    }

    // ── Count active (non-removed) seats in a layout ──
    private int computeActiveSeats(ScreenLayout layout) {
        int count = 0;
        if (layout.getRows() == null) return 0;
        for (ScreenLayout.LayoutRow row : layout.getRows()) {
            if (row.getSeats() == null) continue;
            for (ScreenLayout.LayoutSeat seat : row.getSeats()) {
                if ("ACTIVE".equals(seat.getStatus())) {
                    count++;
                }
            }
        }
        return count;
    }
}
