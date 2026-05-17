package com.cinex.controller;

import com.cinex.dto.AuthResponse;
import com.cinex.dto.RefreshRequest;
import com.cinex.dto.RegisterRequest;
import com.cinex.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody Map<String, String> body) {
        return authService.login(body.get("email"), body.get("password"));
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody RefreshRequest request,
                                @RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = request.getToken();
        if ((token == null || token.isBlank()) && authorization != null && authorization.startsWith("Bearer ")) {
            token = authorization.substring(7);
        }
        return authService.refreshToken(token);
    }
}