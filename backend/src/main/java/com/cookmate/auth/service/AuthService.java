package com.cookmate.auth.service;

import com.cookmate.auth.dto.AuthResponse;
import com.cookmate.auth.dto.GoogleAuthRequest;
import com.cookmate.auth.dto.LoginRequest;
import com.cookmate.auth.dto.RegisterRequest;
import com.cookmate.auth.dto.UserResponse;
import com.cookmate.auth.exception.AuthException;
import com.cookmate.auth.model.AuthProvider;
import com.cookmate.auth.model.RefreshToken;
import com.cookmate.auth.model.User;
import com.cookmate.auth.repository.RefreshTokenRepository;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.auth.service.GoogleOAuthService.GoogleUserInfo;
import com.cookmate.shared.security.JwtTokenProvider;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final GoogleOAuthService googleOAuthService;

    @Value("${app.auth.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /** Register a new user with email and password. */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AuthException.emailTaken();
        }

        User user =
                User.builder()
                        .email(request.getEmail())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .displayName(request.getDisplayName())
                        .authProvider(AuthProvider.LOCAL)
                        .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    /** Authenticate with email and password. */
    public AuthResponse login(LoginRequest request) {
        User user =
                userRepository
                        .findByEmail(request.getEmail())
                        .orElseThrow(AuthException::badCredentials);

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw AuthException.oauthOnly();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw AuthException.badCredentials();
        }

        return buildAuthResponse(user);
    }

    /** Authenticate or register via Google OAuth. */
    public AuthResponse googleAuth(GoogleAuthRequest request) {
        GoogleUserInfo googleUser = googleOAuthService.verify(request.getIdToken());

        // Find existing user by Google provider ID
        User user =
                userRepository
                        .findByProviderIdAndAuthProvider(
                                googleUser.providerId(), AuthProvider.GOOGLE)
                        .orElse(null);

        if (user == null) {
            // Check if email already exists with a local account
            user = userRepository.findByEmail(googleUser.email()).orElse(null);

            if (user != null && user.getAuthProvider() == AuthProvider.LOCAL) {
                // Don't silently override local account — user must login with password
                throw AuthException.emailExistsWithPassword();
            } else if (user == null) {
                // Create new user from Google info
                user =
                        User.builder()
                                .email(googleUser.email())
                                .displayName(googleUser.name())
                                .avatarUrl(googleUser.picture())
                                .authProvider(AuthProvider.GOOGLE)
                                .providerId(googleUser.providerId())
                                .emailVerified(true)
                                .build();
                user = userRepository.save(user);
            }
        }

        return buildAuthResponse(user);
    }

    /** Issue a new access token using a valid refresh token. */
    public AuthResponse refresh(String refreshTokenStr) {
        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByToken(refreshTokenStr)
                        .orElseThrow(AuthException::invalidToken);

        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw AuthException.invalidToken();
        }

        User user =
                userRepository
                        .findById(refreshToken.getUserId())
                        .orElseThrow(AuthException::invalidToken);

        String accessToken = jwtTokenProvider.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .user(UserResponse.from(user))
                .build();
    }

    /** Revoke a refresh token (logout). */
    public void logout(String refreshTokenStr) {
        refreshTokenRepository.deleteByToken(refreshTokenStr);
    }

    /** Build AuthResponse with new access + refresh tokens. */
    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshTokenStr = jwtTokenProvider.generateRefreshToken();

        RefreshToken refreshToken =
                RefreshToken.builder()
                        .token(refreshTokenStr)
                        .userId(user.getId())
                        .expiryDate(Instant.now().plusMillis(refreshTokenExpiration))
                        .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .user(UserResponse.from(user))
                .build();
    }
}
