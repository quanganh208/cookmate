package com.cookmate.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.cookmate.auth.dto.AuthResponse;
import com.cookmate.auth.dto.GoogleAuthRequest;
import com.cookmate.auth.dto.LoginRequest;
import com.cookmate.auth.dto.RegisterRequest;
import com.cookmate.auth.exception.AuthException;
import com.cookmate.auth.model.AuthProvider;
import com.cookmate.auth.model.RefreshToken;
import com.cookmate.auth.model.Role;
import com.cookmate.auth.model.User;
import com.cookmate.auth.repository.RefreshTokenRepository;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.auth.service.GoogleOAuthService.GoogleUserInfo;
import com.cookmate.shared.security.JwtTokenProvider;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private GoogleOAuthService googleOAuthService;
    @Mock private PasswordResetService passwordResetService;

    @InjectMocks private AuthService authService;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshTokenExpiration", 2592000000L);

        testUser =
                User.builder()
                        .id("user123")
                        .email("test@example.com")
                        .password("encoded_password")
                        .displayName("Test User")
                        .authProvider(AuthProvider.LOCAL)
                        .roles(Set.of(Role.USER))
                        .build();

        registerRequest = new RegisterRequest();
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setDisplayName("New User");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
    }

    @Test
    void register_WithNewEmail_ShouldCreateUser() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtTokenProvider.generateAccessToken(any(User.class))).thenReturn("access_token_123");
        when(jwtTokenProvider.generateRefreshToken()).thenReturn("refresh_token_123");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(new RefreshToken());

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertNotNull(response.getUser());
        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void register_WithExistingEmail_ShouldThrowAuthException() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        assertThrows(AuthException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_WithValidCredentials_ShouldReturnAuthResponse() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword()))
                .thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("access_token_123");
        when(jwtTokenProvider.generateRefreshToken()).thenReturn("refresh_token_123");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(new RefreshToken());

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertNotNull(response.getUser());
    }

    @Test
    void login_WithNonExistentEmail_ShouldThrowAuthException() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.empty());

        assertThrows(AuthException.class, () -> authService.login(loginRequest));
    }

    @Test
    void login_WithWrongPassword_ShouldThrowAuthException() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword()))
                .thenReturn(false);

        assertThrows(AuthException.class, () -> authService.login(loginRequest));
    }

    @Test
    void login_WithOAuthUser_ShouldThrowAuthException() {
        User oauthUser =
                User.builder()
                        .id("user456")
                        .email("oauth@example.com")
                        .authProvider(AuthProvider.GOOGLE)
                        .providerId("google123")
                        .roles(Set.of(Role.USER))
                        .build();

        when(userRepository.findByEmail(loginRequest.getEmail()))
                .thenReturn(Optional.of(oauthUser));

        assertThrows(AuthException.class, () -> authService.login(loginRequest));
    }

    @Test
    void googleAuth_WithNewGoogleUser_ShouldCreateUser() {
        GoogleAuthRequest googleRequest = new GoogleAuthRequest();
        googleRequest.setIdToken("token123");
        GoogleUserInfo googleUserInfo =
                new GoogleUserInfo(
                        "google123", "google@example.com", "Google User", "http://avatar.jpg");

        when(googleOAuthService.verify(googleRequest.getIdToken())).thenReturn(googleUserInfo);
        when(userRepository.findByProviderIdAndAuthProvider("google123", AuthProvider.GOOGLE))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtTokenProvider.generateAccessToken(any(User.class))).thenReturn("access_token_123");
        when(jwtTokenProvider.generateRefreshToken()).thenReturn("refresh_token_123");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(new RefreshToken());

        AuthResponse response = authService.googleAuth(googleRequest);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void googleAuth_WithExistingGoogleUser_ShouldReturnAuthResponse() {
        GoogleAuthRequest googleRequest = new GoogleAuthRequest();
        googleRequest.setIdToken("token123");
        GoogleUserInfo googleUserInfo =
                new GoogleUserInfo(
                        "google123", "google@example.com", "Google User", "http://avatar.jpg");

        when(googleOAuthService.verify(googleRequest.getIdToken())).thenReturn(googleUserInfo);
        when(userRepository.findByProviderIdAndAuthProvider("google123", AuthProvider.GOOGLE))
                .thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("access_token_123");
        when(jwtTokenProvider.generateRefreshToken()).thenReturn("refresh_token_123");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(new RefreshToken());

        AuthResponse response = authService.googleAuth(googleRequest);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void googleAuth_WithExistingLocalAccount_ShouldRejectLinking() {
        GoogleAuthRequest googleRequest = new GoogleAuthRequest();
        googleRequest.setIdToken("token123");
        GoogleUserInfo googleUserInfo =
                new GoogleUserInfo(
                        "google123", "test@example.com", "Test User", "http://avatar.jpg");

        when(googleOAuthService.verify(googleRequest.getIdToken())).thenReturn(googleUserInfo);
        when(userRepository.findByProviderIdAndAuthProvider("google123", AuthProvider.GOOGLE))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        AuthException exception =
                assertThrows(AuthException.class, () -> authService.googleAuth(googleRequest));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void refresh_WithValidRefreshToken_ShouldReturnNewAccessToken() {
        RefreshToken refreshToken =
                RefreshToken.builder()
                        .token("refresh_token_123")
                        .userId("user123")
                        .expiryDate(Instant.now().plusSeconds(86400))
                        .revoked(false)
                        .build();

        when(refreshTokenRepository.findByToken("refresh_token_123"))
                .thenReturn(Optional.of(refreshToken));
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("new_access_token");

        AuthResponse response = authService.refresh("refresh_token_123");

        assertNotNull(response);
        assertEquals("new_access_token", response.getAccessToken());
        assertEquals("refresh_token_123", response.getRefreshToken());
        verify(jwtTokenProvider).generateAccessToken(testUser);
    }

    @Test
    void refresh_WithInvalidRefreshToken_ShouldThrowAuthException() {
        when(refreshTokenRepository.findByToken("invalid_token")).thenReturn(Optional.empty());

        assertThrows(AuthException.class, () -> authService.refresh("invalid_token"));
    }

    @Test
    void refresh_WithRevokedToken_ShouldThrowAuthException() {
        RefreshToken refreshToken =
                RefreshToken.builder()
                        .token("refresh_token_123")
                        .userId("user123")
                        .expiryDate(Instant.now().plusSeconds(86400))
                        .revoked(true)
                        .build();

        when(refreshTokenRepository.findByToken("refresh_token_123"))
                .thenReturn(Optional.of(refreshToken));

        assertThrows(AuthException.class, () -> authService.refresh("refresh_token_123"));
    }

    @Test
    void refresh_WithExpiredToken_ShouldThrowAuthException() {
        RefreshToken refreshToken =
                RefreshToken.builder()
                        .token("refresh_token_123")
                        .userId("user123")
                        .expiryDate(Instant.now().minusSeconds(86400))
                        .revoked(false)
                        .build();

        when(refreshTokenRepository.findByToken("refresh_token_123"))
                .thenReturn(Optional.of(refreshToken));

        assertThrows(AuthException.class, () -> authService.refresh("refresh_token_123"));
    }

    @Test
    void logout_ShouldDeleteRefreshToken() {
        authService.logout("refresh_token_123");
        verify(refreshTokenRepository).deleteByToken("refresh_token_123");
    }

    @Test
    void register_ShouldSetAuthProviderToLocal() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtTokenProvider.generateAccessToken(any(User.class))).thenReturn("access_token_123");
        when(jwtTokenProvider.generateRefreshToken()).thenReturn("refresh_token_123");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(new RefreshToken());

        authService.register(registerRequest);

        verify(userRepository).save(argThat(user -> user.getAuthProvider() == AuthProvider.LOCAL));
    }
}
