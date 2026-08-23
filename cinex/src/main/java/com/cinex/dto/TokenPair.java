package com.cinex.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TokenPair {
    private String accessToken;
    private String refreshToken;
    private String role;
    private String email;
    private boolean firstLogin;
    private boolean demoMode;

    public TokenPair(String accessToken, String refreshToken, String role, String email) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.role = role;
        this.email = email;
        this.firstLogin = false;
        this.demoMode = false;
    }
}
