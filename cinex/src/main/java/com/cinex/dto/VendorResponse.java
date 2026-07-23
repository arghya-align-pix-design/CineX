package com.cinex.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VendorResponse {
    private Long id;
    private String email;
    private boolean approved;
    private boolean firstLogin;
}
