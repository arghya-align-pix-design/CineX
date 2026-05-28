package com.cinex.dto;

import lombok.Data;
import java.util.List;

@Data
public class BookingInitiateRequest {
    private Long showId;
    private List<String> seatCodes;
}