package com.cinex.dto;

import lombok.Data;
import java.util.List;

@Data
public class SeatGridConfig {
    private int rows;
    private int columns;
    private List<String> seatCodes;
    private List<String> unavailableSeats;
}
