package com.cinex.dto;

import java.util.List;

import lombok.Data;

@Data
public class SeatGridConfig {
    private int rows;
    private int columns;
    private List<String> seatCodes;
    private List<String> damagedSeats;
    private List<String> unavailableSeats;
    private List<Integer> aisles;
}
