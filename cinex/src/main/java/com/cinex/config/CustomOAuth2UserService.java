package com.cinex.config;

import com.cinex.entity.AuthProvider;
import com.cinex.entity.User;
import com.cinex.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        
        try {
            processOAuthUser(registrationId, oAuth2User);
        } catch (Exception ex) {
            log.error("Error processing OAuth2 user for provider: {}", registrationId, ex);
            throw new OAuth2AuthenticationException(ex.getMessage());
        }

        return oAuth2User;
    }

    private User processOAuthUser(String registrationId, OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = null;
        String name = null;
        String providerId = null;
        AuthProvider provider = AuthProvider.LOCAL;

        if ("google".equalsIgnoreCase(registrationId)) {
            provider = AuthProvider.GOOGLE;
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
            providerId = (String) attributes.get("sub");
        } else if ("github".equalsIgnoreCase(registrationId)) {
            provider = AuthProvider.GITHUB;
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
            if (name == null) {
                name = (String) attributes.get("login");
            }
            Object idObj = attributes.get("id");
            providerId = idObj != null ? String.valueOf(idObj) : null;
            
            // GitHub might not return public email if private
            if (email == null && attributes.get("login") != null) {
                email = attributes.get("login") + "@users.noreply.github.com";
            }
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email not found from OAuth2 provider");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (user.getProvider() == null || user.getProvider() == AuthProvider.LOCAL) {
                user.setProvider(provider);
                user.setProviderId(providerId);
            }
            if (name != null && !name.isBlank()) {
                user.setName(name);
            }
            user = userRepository.save(user);
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(name != null ? name : email.split("@")[0]);
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setRole(User.Role.CONSUMER);
            user.setApproved(true);
            user.setFirstLogin(false);
            user = userRepository.save(user);
        }

        return user;
    }
}
