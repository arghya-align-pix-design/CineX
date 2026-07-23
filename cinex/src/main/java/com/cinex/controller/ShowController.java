package com.cinex.controller;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinex.dto.ShowRequest;
import com.cinex.dto.ShowResponse;
import com.cinex.entity.Show;
import com.cinex.service.ShowService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/shows")
@RequiredArgsConstructor
public class ShowController {

    private final ShowService showService;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ShowResponse createShow(@Valid @RequestBody ShowRequest request,
                                    org.springframework.security.core.Authentication authentication) {
        Show show = showService.createShow(request, authentication.getName());
        return showService.getShowWithSeats(show.getId());
    }

    @GetMapping
    public List<ShowResponse> searchShows(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long movieId) {
        return showService.searchShows(city, date, movieId);
    }

    @GetMapping("/{id}")
    public ShowResponse getShow(@PathVariable Long id) {
        return showService.getShowWithSeats(id);
    }

    @GetMapping("/{id}/seats")
    public Object getShowSeats(@PathVariable Long id) {
        return showService.getShowSeats(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public void removeShow(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        showService.removeShow(id, authentication.getName());
    }

    @PutMapping("/{id}/end-date")
    @PreAuthorize("hasRole('VENDOR')")
    public ShowResponse updateShowEndDate(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            org.springframework.security.core.Authentication authentication) {
        return showService.updateShowEndDate(id, endDate, authentication.getName());
    }
}