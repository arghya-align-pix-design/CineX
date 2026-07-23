package com.cinex.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.cinex.dto.ScreenLayoutRequest;
import com.cinex.dto.ScreenRequest;
import com.cinex.dto.ScreenResponse;
import com.cinex.entity.Screen;
import com.cinex.service.ScreenService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ScreenController {

    private final ScreenService screenService;

    // ── Create a new screen within a theatre ──
    @PostMapping("/theatres/{theatreId}/screens")
    @PreAuthorize("hasRole('VENDOR')")
    public ScreenResponse createScreen(@PathVariable Long theatreId,
                                       @Valid @RequestBody ScreenRequest request) {
        Screen screen = screenService.createScreen(theatreId, request);
        return screenService.toResponse(screen);
    }

    // ── List all active screens for a theatre ──
    @GetMapping("/theatres/{theatreId}/screens")
    @PreAuthorize("hasRole('VENDOR')")
    public List<ScreenResponse> getScreens(@PathVariable Long theatreId) {
        return screenService.getScreens(theatreId).stream()
                .map(screenService::toResponse)
                .toList();
    }

    // ── Get a single screen (with full layout) ──
    @GetMapping("/screens/{screenId}")
    public ScreenResponse getScreen(@PathVariable Long screenId) {
        Screen screen = screenService.getScreen(screenId);
        return screenService.toResponse(screen);
    }

    // ── Save/update the entire seat layout for a screen ──
    @PutMapping("/screens/{screenId}/layout")
    @PreAuthorize("hasRole('VENDOR')")
    public ScreenResponse saveLayout(@PathVariable Long screenId,
                                     @Valid @RequestBody ScreenLayoutRequest request) {
        Screen screen = screenService.saveLayout(screenId, request.getLayout());
        return screenService.toResponse(screen);
    }

    // ── Update screen metadata (name, sound, projection, capacity) ──
    @PutMapping("/screens/{screenId}")
    @PreAuthorize("hasRole('VENDOR')")
    public ScreenResponse updateScreen(@PathVariable Long screenId,
                                       @Valid @RequestBody ScreenRequest request) {
        Screen screen = screenService.updateScreen(screenId, request);
        return screenService.toResponse(screen);
    }

    // ── Soft-delete a screen ──
    @DeleteMapping("/screens/{screenId}")
    @PreAuthorize("hasRole('VENDOR')")
    public String deleteScreen(@PathVariable Long screenId) {
        screenService.deleteScreen(screenId);
        return "Screen deactivated successfully";
    }
}
