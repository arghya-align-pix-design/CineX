package com.cinex;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cinex.dto.AuthResponse;
import com.cinex.service.AuthService;
import com.cinex.service.VendorInviteService;
import com.cinex.repository.UserRepository;

@SpringBootTest
@ActiveProfiles("test")
class CinexApplicationTests {

	@Autowired
	private VendorInviteService vendorInviteService;

	@Autowired
	private AuthService authService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Test
	void updateVendorPassword() {
		userRepository.findByEmail("vendor@cinex.com").ifPresent(vendor -> {
			vendor.setPasswordHash(passwordEncoder.encode("vendor123"));
			vendor.setFirstLogin(true);
			vendor.setApproved(true);
			userRepository.save(vendor);
			System.out.println("UPDATED_VENDOR_PASSWORD_SUCCESSFULLY");
		});
	}

	@Test
	@Transactional
	void testVendorInviteAndLoginFlow() {
		String email = "test_invite_vendor@cinex.com";

		// Ensure user doesn't exist
		userRepository.findByEmail(email).ifPresent(u -> userRepository.delete(u));

		// Invite vendor
		String inviteResult = vendorInviteService.inviteVendor(email);

		// Extract password from: "Vendor invited successfully. Invitation email dispatched to ... Temp password: [tempPassword]"
		String marker = "Temp password: ";
		int index = inviteResult.indexOf(marker);
		assertTrue(index > 0);
		String tempPassword = inviteResult.substring(index + marker.length()).trim();

		assertNotNull(tempPassword);
		assertFalse(tempPassword.isEmpty());

		// Attempt login
		AuthResponse loginResponse = authService.login(email, tempPassword);
		assertNotNull(loginResponse);
		assertNotNull(loginResponse.getToken());
		assertEquals("VENDOR", loginResponse.getRole());
		assertTrue(loginResponse.isFirstLogin());
	}
}
