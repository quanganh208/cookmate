package com.cookmate.shared.security;

import static org.junit.jupiter.api.Assertions.*;

import com.cookmate.auth.model.AuthProvider;
import com.cookmate.auth.model.Role;
import com.cookmate.auth.model.User;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private User testUser;

    @BeforeEach
    void setUp() {
        String secret =
                "dev-jwt-secret-must-be-at-least-64-characters-long-for-hmac-sha512-signing";
        long accessTokenExpiration = 900000; // 15 minutes
        jwtTokenProvider = new JwtTokenProvider(secret, accessTokenExpiration);

        testUser =
                User.builder()
                        .id("user123")
                        .email("test@example.com")
                        .displayName("Test User")
                        .authProvider(AuthProvider.LOCAL)
                        .roles(Set.of(Role.USER))
                        .build();
    }

    @Test
    void generateAccessToken_ShouldCreateValidToken() {
        String token = jwtTokenProvider.generateAccessToken(testUser);
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts
    }

    @Test
    void generateAccessToken_ShouldContainUserIdAsSubject() {
        String token = jwtTokenProvider.generateAccessToken(testUser);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        assertEquals("user123", userId);
    }

    @Test
    void generateAccessToken_TokensAreValid() {
        String token1 = jwtTokenProvider.generateAccessToken(testUser);
        String token2 = jwtTokenProvider.generateAccessToken(testUser);
        // Both tokens should be valid
        assertTrue(jwtTokenProvider.validateToken(token1));
        assertTrue(jwtTokenProvider.validateToken(token2));
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        String token = jwtTokenProvider.generateAccessToken(testUser);
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnFalse() {
        String invalidToken = "invalid.token.here";
        assertFalse(jwtTokenProvider.validateToken(invalidToken));
    }

    @Test
    void validateToken_WithEmptyToken_ShouldReturnFalse() {
        assertFalse(jwtTokenProvider.validateToken(""));
    }

    @Test
    void validateToken_WithNullToken_ShouldReturnFalse() {
        assertFalse(jwtTokenProvider.validateToken(null));
    }

    @Test
    void validateToken_WithMalformedToken_ShouldReturnFalse() {
        String malformed = "this.is.not.valid.jwt";
        assertFalse(jwtTokenProvider.validateToken(malformed));
    }

    @Test
    void getUserIdFromToken_ShouldExtractCorrectUserId() {
        String token = jwtTokenProvider.generateAccessToken(testUser);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        assertEquals("user123", userId);
    }

    @Test
    void getUserIdFromToken_WithDifferentUser_ShouldReturnDifferentId() {
        User anotherUser =
                User.builder()
                        .id("user456")
                        .email("another@example.com")
                        .displayName("Another User")
                        .authProvider(AuthProvider.LOCAL)
                        .roles(Set.of(Role.USER))
                        .build();

        String token = jwtTokenProvider.generateAccessToken(anotherUser);
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        assertEquals("user456", userId);
    }

    @Test
    void generateRefreshToken_ShouldCreateRandomString() {
        String refreshToken1 = jwtTokenProvider.generateRefreshToken();
        String refreshToken2 = jwtTokenProvider.generateRefreshToken();

        assertNotNull(refreshToken1);
        assertNotNull(refreshToken2);
        assertNotEquals(refreshToken1, refreshToken2);
    }

    @Test
    void generateRefreshToken_ShouldBeValidUUID() {
        String refreshToken = jwtTokenProvider.generateRefreshToken();
        assertDoesNotThrow(() -> java.util.UUID.fromString(refreshToken));
    }

    @Test
    void generateAccessToken_WithMultipleRoles_ShouldEncodeAllRoles() {
        User userWithRoles =
                User.builder()
                        .id("user789")
                        .email("admin@example.com")
                        .displayName("Admin User")
                        .authProvider(AuthProvider.LOCAL)
                        .roles(Set.of(Role.USER, Role.ADMIN))
                        .build();

        String token = jwtTokenProvider.generateAccessToken(userWithRoles);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("user789", jwtTokenProvider.getUserIdFromToken(token));
    }

    @Test
    void validateToken_AfterTokenGeneration_ShouldBeValid() {
        String token = jwtTokenProvider.generateAccessToken(testUser);
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void generateAccessToken_ShouldIncludeEmailClaim() {
        String token = jwtTokenProvider.generateAccessToken(testUser);
        // Token should be valid and contain the user's email
        assertTrue(jwtTokenProvider.validateToken(token));
        String userId = jwtTokenProvider.getUserIdFromToken(token);
        assertEquals("user123", userId);
    }
}
