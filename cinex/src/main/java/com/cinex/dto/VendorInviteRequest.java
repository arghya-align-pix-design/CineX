package com.cinex.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VendorInviteRequest {
    @NotBlank(message = "Vendor email is required")
    @Email(message = "Invalid email format")
    private String email;
}
