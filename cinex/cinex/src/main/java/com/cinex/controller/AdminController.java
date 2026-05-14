package com.cinex.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinex.service.AdminService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // Only use this once to create first admin
    // Remove or secure this endpoint in production
    @PostMapping("/setup")
    public String setupAdmin(@RequestBody Map<String, String> body) {
        return adminService.setupAdmin(body.get("email"), body.get("password"));
    }

    @PostMapping("/verify-totp")
    public String verifyTotp(@RequestBody Map<String, String> body) {
        return adminService.verifyTotp(
            body.get("email"),
            Integer.parseInt(body.get("code"))
        );
    }
}