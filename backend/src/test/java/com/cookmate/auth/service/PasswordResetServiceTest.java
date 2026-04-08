package com.cookmate.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.cookmate.auth.exception.AuthException;
import com.cookmate.auth.model.AuthProvider;
import com.cookmate.auth.model.PasswordResetToken;
import com.cookmate.auth.model.Role;
import com.cookmate.auth.model.User;
import com.cookmate.auth.repository.PasswordResetTokenRepository;
import com.cookmate.auth.repository.RefreshTokenRepository;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.shared.service.EmailService;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;

    private PasswordResetService service;

    private User localUser;
    private User oauthUser;

    @BeforeEach
    void setUp() {
        service =
                new PasswordResetService(
                        userRepository,
                        tokenRepository,
                        refreshTokenRepository,
                        passwordEncoder,
                        emailService,
                        15,
                        "cookmate://reset",
                        3,
                        60);

        localUser =
                User.builder()
                        .id("user-local")
                        .email("alice@example.com")
                        .password("encoded-old-password")
                        .displayName("Alice")
                        .authProvider(AuthProvider.LOCAL)
                        .roles(Set.of(Role.USER))
                        .build();

        oauthUser =
                User.builder()
                        .id("user-google")
                        .email("bob@example.com")
                        .displayName("Bob")
                        .authProvider(AuthProvider.GOOGLE)
                        .providerId("google-sub-123")
                        .roles(Set.of(Role.USER))
                        .build();
    }

    // ---------- createResetToken ----------

    @Test
    void createResetToken_UnknownEmail_DoesNothing() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        service.createResetToken("ghost@example.com");

        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(any(), any(), any());
    }

    @Test
    void createResetToken_OAuthUser_Skipped() {
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(oauthUser));

        service.createResetToken("bob@example.com");

        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(any(), any(), any());
    }

    @Test
    void createResetToken_LocalUser_SavesHashAndSendsEmail() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(localUser));

        service.createResetToken("alice@example.com");

        ArgumentCaptor<PasswordResetToken> tokenCaptor =
                ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        PasswordResetToken saved = tokenCaptor.getValue();

        assertNotNull(saved.getTokenHash(), "hash must be set");
        assertEquals(64, saved.getTokenHash().length(), "SHA-256 hex is 64 chars");
        assertEquals("user-local", saved.getUserId());
        assertFalse(saved.isUsed());
        assertNotNull(saved.getExpireAt());
        assertTrue(saved.getExpireAt().isAfter(Instant.now()));

        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService)
                .sendPasswordResetEmail(eq("alice@example.com"), eq("Alice"), linkCaptor.capture());
        assertTrue(
                linkCaptor.getValue().startsWith("cookmate://reset?token="),
                "reset link should contain the plaintext token");
    }

    @Test
    void createResetToken_ExceedsRateLimit_ThrowsAuthException() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(localUser));

        service.createResetToken("alice@example.com");
        service.createResetToken("alice@example.com");
        service.createResetToken("alice@example.com");

        AuthException ex =
                assertThrows(
                        AuthException.class, () -> service.createResetToken("alice@example.com"));
        assertEquals("RESET_RATE_LIMITED", ex.getCode());
    }

    // ---------- verifyAndReset ----------

    @Test
    void verifyAndReset_UnknownToken_Throws() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        AuthException ex =
                assertThrows(
                        AuthException.class, () -> service.verifyAndReset("fake", "NewPass123!"));
        assertEquals("RESET_TOKEN_INVALID", ex.getCode());
    }

    @Test
    void verifyAndReset_UsedToken_Throws() {
        PasswordResetToken used =
                PasswordResetToken.builder()
                        .tokenHash("anything")
                        .userId("user-local")
                        .expireAt(Instant.now().plusSeconds(600))
                        .used(true)
                        .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(used));

        AuthException ex =
                assertThrows(
                        AuthException.class,
                        () -> service.verifyAndReset("anytoken", "NewPass123!"));
        assertEquals("RESET_TOKEN_INVALID", ex.getCode());
    }

    @Test
    void verifyAndReset_ExpiredToken_Throws() {
        PasswordResetToken expired =
                PasswordResetToken.builder()
                        .tokenHash("anything")
                        .userId("user-local")
                        .expireAt(Instant.now().minusSeconds(60))
                        .used(false)
                        .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(expired));

        AuthException ex =
                assertThrows(
                        AuthException.class,
                        () -> service.verifyAndReset("anytoken", "NewPass123!"));
        assertEquals("RESET_TOKEN_EXPIRED", ex.getCode());
    }

    @Test
    void verifyAndReset_OAuthUser_RejectsAsInvalid() {
        PasswordResetToken token =
                PasswordResetToken.builder()
                        .tokenHash("anything")
                        .userId("user-google")
                        .expireAt(Instant.now().plusSeconds(600))
                        .used(false)
                        .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(userRepository.findById("user-google")).thenReturn(Optional.of(oauthUser));

        AuthException ex =
                assertThrows(
                        AuthException.class,
                        () -> service.verifyAndReset("anytoken", "NewPass123!"));
        assertEquals("RESET_TOKEN_INVALID", ex.getCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyAndReset_HappyPath_UpdatesPasswordAndRevokesRefreshTokens() {
        PasswordResetToken token =
                PasswordResetToken.builder()
                        .tokenHash("anything")
                        .userId("user-local")
                        .expireAt(Instant.now().plusSeconds(600))
                        .used(false)
                        .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(userRepository.findById("user-local")).thenReturn(Optional.of(localUser));
        when(passwordEncoder.encode("BrandNewPass123!")).thenReturn("encoded-new");

        service.verifyAndReset("anytoken", "BrandNewPass123!");

        assertEquals("encoded-new", localUser.getPassword());
        assertTrue(token.isUsed(), "token must be marked used after reset");
        verify(userRepository).save(localUser);
        verify(tokenRepository).save(token);
        verify(refreshTokenRepository).deleteByUserId("user-local");
    }
}
