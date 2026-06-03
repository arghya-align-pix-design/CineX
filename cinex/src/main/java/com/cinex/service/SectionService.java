package com.cinex.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.cinex.dto.SeatGridConfig;
import com.cinex.dto.SectionRequest;
import com.cinex.entity.Section;
import com.cinex.entity.Theatre;
import com.cinex.repository.SectionRepository;
import com.cinex.repository.TheatreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepository sectionRepository;
    private final TheatreRepository theatreRepository;

    public Section addSection(Long theatreId, SectionRequest request) {
        Theatre theatre = theatreRepository.findById(theatreId)
                .orElseThrow(() -> new RuntimeException("Theatre not found"));

        if (sectionRepository.existsByTheatreIdAndName(theatreId, request.getName())) {
            throw new RuntimeException("Section name already exists in this theatre");
        }

        if (request.getRows() * request.getCols() > 500) {
            throw new RuntimeException("Section cannot exceed 500 seats");
        }

        SeatGridConfig grid = new SeatGridConfig();
        grid.setRows(request.getRows());
        grid.setColumns(request.getCols());
        grid.setSeatCodes(generateSeatCodes(request.getRows(), request.getCols()));
        grid.setDamagedSeats(new ArrayList<>());
        grid.setUnavailableSeats(new ArrayList<>());
        grid.setAisles(new ArrayList<>());

        Section section = new Section();
        section.setName(request.getName());
        section.setSeatType(Section.SeatType.valueOf(request.getSeatType().toUpperCase()));
        section.setRows(request.getRows());
        section.setCols(request.getCols());
        section.setPriceMultiplier(request.getPriceMultiplier());
        section.setTheatre(theatre);
        section.setSeatGrid(grid);

        return sectionRepository.save(section);
    }

    private List<String> generateSeatCodes(int rows, int cols) {
        List<String> codes = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            char rowLetter = (char) ('A' + r);
            for (int c = 1; c <= cols; c++) {
                codes.add(rowLetter + String.valueOf(c));
            }
        }
        return codes;
    }

    public List<Section> getSections(Long theatreId) {
        return sectionRepository.findByTheatreIdAndIsActiveTrue(theatreId);
    }

    public Section updateSection(Long theatreId, Long sectionId, SectionRequest request){
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section NOT FOUND!!"));
        
        if(!section.getTheatre().getId().equals(theatreId)){
            throw new RuntimeException("Section Doesnot belong to this theatre!!");
        }
        // Duplicate name check (excluding current section)
        if (!section.getName().equals(request.getName()) &&
            sectionRepository.existsByTheatreIdAndName(theatreId, request.getName())) {
            throw new RuntimeException("Section name already exists in this theatre");
        }

        // Max seats validation - 500 seats max per section
        if (request.getRows() * request.getCols() > 500) {
            throw new RuntimeException("Section cannot exceed 500 seats");
        }

        section.setName(request.getName());
        section.setSeatType(Section.SeatType.valueOf(request.getSeatType().toUpperCase()));
        section.setRows(request.getRows());
        section.setCols(request.getCols());
        section.setPriceMultiplier(request.getPriceMultiplier());

        // Regenerate seat codes if rows/cols changed
        SeatGridConfig grid = section.getSeatGrid();
        grid.setRows(request.getRows());
        grid.setColumns(request.getCols());
        grid.setSeatCodes(generateSeatCodes(request.getRows(), request.getCols()));
        section.setSeatGrid(grid);

        return sectionRepository.save(section);
    }

    public void deleteSection(Long theatreId, Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));

        if (!section.getTheatre().getId().equals(theatreId)) {
            throw new RuntimeException("Section does not belong to this theatre");
        }

        section.setActive(false);
        sectionRepository.save(section);
    }


}
