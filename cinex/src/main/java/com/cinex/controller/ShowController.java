package com.cinex.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
    //@PreAuthorize("hasRole('VENDOR')")
    public Show createShow(@RequestBody ShowRequest request) {
        return showService.createShow(request);
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
}