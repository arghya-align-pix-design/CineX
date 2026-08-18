package com.cinex.config;

import com.cinex.entity.User;
import com.cinex.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${cinex.app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        String email = (String) attributes.get("email");
        if (email == null && attributes.get("login") != null) {
            email = attributes.get("login") + "@users.noreply.github.com";
        }

        log.info("OAuth2 login successful for email: {}", email);

        if (email != null) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

                String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/callback")
                        .queryParam("token", token)
                        .queryParam("email", user.getEmail())
                        .queryParam("role", user.getRole().name())
                        .queryParam("name", user.getName() != null ? user.getName() : "")
                        .build().toUriString();

                getRedirectStrategy().sendRedirect(request, response, targetUrl);
                return;
            }
        }

        // Fallback if email is missing
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=oauth_failed");
    }
}
