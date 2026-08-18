package com.cinex.dto;
import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String role;
    private boolean firstLogin;

    private boolean demoMode;

    public AuthResponse(String token, String role){
        this.token=token;
        this.role=role;
    }

    public AuthResponse(String token, String role, boolean demoMode){
        this.token=token;
        this.role=role;
        this.demoMode=demoMode;
    }
}
