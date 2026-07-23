package com.cinex.controller;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinex.dto.SectionRequest;
import com.cinex.dto.SectionResponse;
import com.cinex.dto.TheatreRequest;
import com.cinex.dto.TheatreResponse;
import com.cinex.entity.Theatre;
import com.cinex.mapper.TheatreMapper;
import com.cinex.service.SectionService;
import com.cinex.service.TheatreService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/theatres")
@RequiredArgsConstructor
public class TheatreController {

    private final TheatreService theatreService;
    private final SectionService sectionService;
    private final TheatreMapper theatreMapper;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public TheatreResponse createTheatre(@Valid @RequestBody TheatreRequest request,
                                      Authentication authentication) {
        Theatre theatre = theatreService.createTheatre(request, authentication.getName());
        return theatreMapper.toResponse(theatre);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('VENDOR')")
    public List<TheatreResponse> getMyTheatres(Authentication authentication) {
        return theatreService.getVendorTheatres(authentication.getName())
            .stream()
            .map(theatreMapper::toResponse)
            .toList();
    }

    @PostMapping("/{theatreId}/sections")
    @PreAuthorize("hasRole('VENDOR')")
    public SectionResponse addSection(@PathVariable Long theatreId,
                            @Valid @RequestBody SectionRequest request) {
        return sectionService.toResponse(sectionService.addSection(theatreId, request));
    }

    @GetMapping("/{theatreId}/sections")
    public List<SectionResponse> getSections(@PathVariable Long theatreId) {
        return sectionService.getSections(theatreId).stream()
            .map(sectionService::toResponse).toList();
    }

    @GetMapping("/{theatreId}/layout")
    public TheatreResponse getLayout(@PathVariable Long theatreId) {
        Theatre theatre = theatreService.getLayout(theatreId);
        return theatreMapper.toResponse(theatre);
    }

    @PutMapping("/{theatreId}/sections/{sectionId}")
    @PreAuthorize("hasRole('VENDOR')")
    public SectionResponse updateSection(@PathVariable Long theatreId,
                                @PathVariable Long sectionId,
                                @Valid @RequestBody SectionRequest request) {
        return sectionService.toResponse(sectionService.updateSection(theatreId, sectionId, request));
    }

    @DeleteMapping("/{theatreId}/sections/{sectionId}")
    @PreAuthorize("hasRole('VENDOR')")
    public String deleteSection(@PathVariable Long theatreId,
                                @PathVariable Long sectionId) {
        sectionService.deleteSection(theatreId, sectionId);
        return "Section deactivated successfully";
    }


}
