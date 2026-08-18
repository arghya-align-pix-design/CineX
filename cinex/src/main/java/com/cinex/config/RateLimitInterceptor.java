package com.cinex.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Interceptor using the Token Bucket algorithm (Bucket4j).
 *
 * HOW IT WORKS (in plain English):
 * ─────────────────────────────────
 * Imagine every user gets a jar of tokens. Each API request costs 1 token.
 * The jar refills automatically over time (e.g., 5 tokens every minute).
 * If the jar is empty → request is rejected with 429 "Too Many Requests".
 *
 * Different endpoints get different-sized jars:
 *   - Login endpoints:  5 tokens/minute  (brute-force protection)
 *   - Register:         3 tokens/minute  (spam prevention)
 *   - Booking:          10 tokens/minute  (booking spam prevention)
 *   - Everything else:  60 tokens/minute  (general DDoS protection)
 *
 * Each user is identified by their IP address.
 * The key format is "IP:tier" so the same IP can have separate buckets
 * for login vs. general requests.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    // ── The bucket storage ──
    // Key = "192.168.1.1:AUTH" or "192.168.1.1:GENERAL"
    // Value = the token bucket for that IP + tier combo
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        // Skip rate limiting for non-API requests (static files, actuator health checks)
        String path = request.getRequestURI();
        if (path.startsWith("/actuator") || path.startsWith("/health")) {
            return true;
        }

        // ── Step 1: Figure out who is making the request ──
        String clientIp = extractClientIp(request);

        // ── Step 2: Figure out which rate limit tier this endpoint belongs to ──
        RateTier tier = resolveRateTier(path);

        // ── Step 3: Get or create the token bucket for this IP + tier ──
        String bucketKey = clientIp + ":" + tier.name();
        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket(tier));

        // ── Step 4: Try to consume 1 token ──
        if (bucket.tryConsume(1)) {
            // Token consumed → request goes through
            return true;
        } else {
            // Jar is empty → reject with 429
            log.warn("Rate limit exceeded for IP {} on tier {} (path: {})", clientIp, tier, path);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"status\":429,\"message\":\"Too many requests. Please slow down and retry in a moment.\"}"
            );
            return false;  // Block the request — it never reaches the controller
        }
    }

    /**
     * Determines which rate limit tier an endpoint belongs to.
     * Login/TOTP endpoints get strict limits, general endpoints get relaxed limits.
     */
    private RateTier resolveRateTier(String path) {
        if (path.startsWith("/auth/login") || path.startsWith("/admin/login-step1")) {
            return RateTier.AUTH_LOGIN;
        }
        if (path.startsWith("/admin/verify-totp")) {
            return RateTier.AUTH_TOTP;
        }
        if (path.startsWith("/auth/register")) {
            return RateTier.AUTH_REGISTER;
        }
        if (path.startsWith("/auth/forgot-password")) {
            return RateTier.AUTH_FORGOT_PASSWORD;
        }
        if (path.startsWith("/bookings/initiate")) {
            return RateTier.BOOKING;
        }
        return RateTier.GENERAL;
    }

    /**
     * Creates a new token bucket with the capacity and refill rate
     * defined for the given tier.
     */
    private Bucket createBucket(RateTier tier) {
        Bandwidth limit = Bandwidth.classic(
            tier.capacity,                                          // max tokens in the jar
            Refill.greedy(tier.capacity, Duration.ofMinutes(1))    // refill all tokens every minute
        );
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Extracts the real client IP, handling reverse proxies (Nginx).
     * When behind Nginx, the real IP is in the X-Forwarded-For header.
     * Without this, all users behind Nginx would share the same IP (127.0.0.1).
     */
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
            // The first one is the real client IP
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Rate limit tiers — each defines how many requests per minute are allowed.
     * You can change these numbers anytime to adjust the limits.
     */
    private enum RateTier {
        AUTH_LOGIN(5),          // 5 login attempts per minute per IP
        AUTH_TOTP(5),           // 5 TOTP attempts per minute per IP
        AUTH_REGISTER(3),       // 3 registrations per minute per IP
        AUTH_FORGOT_PASSWORD(3),// 3 password reset emails per minute per IP
        BOOKING(10),            // 10 booking attempts per minute per IP
        GENERAL(60);            // 60 requests per minute per IP (everything else)

        final int capacity;

        RateTier(int capacity) {
            this.capacity = capacity;
        }
    }
}
