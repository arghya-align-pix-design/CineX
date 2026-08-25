package com.cinex.controller;

import com.cinex.config.CookieUtil;
import com.cinex.dto.AuthResponse;
import com.cinex.dto.ForgotPasswordRequest;
import com.cinex.dto.LoginRequest;
import com.cinex.dto.RefreshRequest;
import com.cinex.dto.RegisterRequest;
import com.cinex.dto.ResetPasswordRequest;
import com.cinex.dto.TokenPair;
import com.cinex.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        TokenPair pair = authService.register(request);
        setAuthCookies(response, pair);
        AuthResponse res = new AuthResponse(pair.getAccessToken(), pair.getRole());
        res.setFirstLogin(pair.isFirstLogin());
        return res;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        TokenPair pair = authService.login(request.getEmail(), request.getPassword());
        setAuthCookies(response, pair);
        AuthResponse res = new AuthResponse(pair.getAccessToken(), pair.getRole());
        res.setFirstLogin(pair.isFirstLogin());
        return res;
    }

    @PostMapping("/demo-login")
    public AuthResponse demoLogin(HttpServletResponse response) {
        TokenPair pair = authService.demoLogin();
        setAuthCookies(response, pair);
        AuthResponse res = new AuthResponse(pair.getAccessToken(), pair.getRole(), true);
        res.setFirstLogin(false);
        return res;
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(HttpServletRequest request,
                                HttpServletResponse response,
                                @RequestBody(required = false) RefreshRequest refreshBody) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if (CookieUtil.REFRESH_COOKIE_NAME.equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        if (refreshToken == null && refreshBody != null) {
            refreshToken = refreshBody.getToken();
        }

        TokenPair pair = authService.refreshToken(refreshToken);
        setAuthCookies(response, pair);
        AuthResponse res = new AuthResponse(pair.getAccessToken(), pair.getRole(), pair.isDemoMode());
        res.setFirstLogin(pair.isFirstLogin());
        return res;
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if (CookieUtil.REFRESH_COOKIE_NAME.equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        authService.logout(refreshToken);

        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.clearAccessCookie().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.clearRefreshCookie().toString());
        return Map.of("message", "Logged out successfully");
    }

    @PostMapping("/oauth2/exchange")
    public AuthResponse exchangeOAuthCode(@RequestBody Map<String, String> body, HttpServletResponse response) {
        String code = body.get("code");
        TokenPair pair = authService.exchangeOAuthCode(code);
        setAuthCookies(response, pair);
        AuthResponse res = new AuthResponse(pair.getAccessToken(), pair.getRole(), pair.isDemoMode());
        res.setFirstLogin(pair.isFirstLogin());
        return res;
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String msg = authService.forgotPassword(request.getEmail());
        return Map.of("message", msg);
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String msg = authService.resetPassword(request.getToken(), request.getNewPassword());
        return Map.of("message", msg);
    }

    private void setAuthCookies(HttpServletResponse response, TokenPair pair) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.createAccessCookie(pair.getAccessToken(), pair.isDemoMode()).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtil.createRefreshCookie(pair.getRefreshToken()).toString());
    }
}