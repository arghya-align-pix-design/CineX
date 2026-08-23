package com.cinex.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {

    @Value("${cinex.cookie.secure:true}")
    private boolean secure;

    public static final String ACCESS_COOKIE_NAME = "cinex_access";
    public static final String REFRESH_COOKIE_NAME = "cinex_refresh";

    public ResponseCookie createAccessCookie(String token, boolean isDemo) {
        long durationHours = isDemo ? 24 : 0;
        long durationMins = isDemo ? 0 : 15;
        Duration maxAge = isDemo ? Duration.ofHours(24) : Duration.ofMinutes(15);

        return ResponseCookie.from(ACCESS_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .maxAge(maxAge)
                .build();
    }

    public ResponseCookie createRefreshCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(secure)
                .path("/auth/refresh")
                .sameSite("Lax")
                .maxAge(Duration.ofDays(7))
                .build();
    }

    public ResponseCookie clearAccessCookie() {
        return ResponseCookie.from(ACCESS_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }

    public ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .path("/auth/refresh")
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }
}
