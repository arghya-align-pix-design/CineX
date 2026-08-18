package com.cinex.config;

import java.io.IOException;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class DemoGuardInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getDetails() instanceof Map<?, ?> details) {
            Object demoFlag = details.get("demo");
            if (Boolean.TRUE.equals(demoFlag)) {
                String method = request.getMethod();

                // Allow safe read HTTP methods
                if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method)) {
                    return true;
                }

                // Whitelist mutating endpoints required for the customer booking & payment flow
                String uri = request.getRequestURI();
                if (isWhitelistedDemoAction(uri)) {
                    return true;
                }

                // Block all other mutating actions (Admin/Vendor modifications)
                sendDemoForbiddenResponse(response);
                return false;
            }
        }

        return true;
    }

    private boolean isWhitelistedDemoAction(String uri) {
        return uri.startsWith("/bookings/initiate") ||
               uri.startsWith("/bookings/confirm") ||
               uri.startsWith("/payments/create-order") ||
               uri.startsWith("/payments/verify") ||
               uri.startsWith("/auth/");
    }

    private void sendDemoForbiddenResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Recruiter Demo Mode is read-only. Data modification in Admin and Vendor modules is disabled.\"}");
    }
}
