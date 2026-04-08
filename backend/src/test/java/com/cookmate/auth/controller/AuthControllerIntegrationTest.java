package com.cookmate.auth.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.cookmate.auth.dto.AuthResponse;
import com.cookmate.auth.dto.ForgotPasswordRequest;
import com.cookmate.auth.dto.LoginRequest;
import com.cookmate.auth.dto.RefreshTokenRequest;
import com.cookmate.auth.dto.RegisterRequest;
import com.cookmate.auth.dto.ResetPasswordRequest;
import com.cookmate.auth.repository.PasswordResetTokenRepository;
import com.cookmate.auth.repository.RefreshTokenRepository;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.shared.service.EmailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@TestPropertySource(
        properties = {"spring.data.mongodb.uri=mongodb://localhost:27017/cookmate-test"})
class AuthControllerIntegrationTest {

    private static final String API_KEY = "dev-api-key-change-in-production";

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;

    /** Replace the real SMTP-backed service so tests never touch Gmail. */
    @MockitoBean private EmailService emailService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc =
                MockMvcBuilders.webAppContextSetup(webApplicationContext)
                        .apply(springSecurity())
                        .build();
        userRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
    }

    // -- Helper methods --

    private RegisterRequest registerRequest(String email, String password, String name) {
        RegisterRequest r = new RegisterRequest();
        r.setEmail(email);
        r.setPassword(password);
        r.setDisplayName(name);
        return r;
    }

    private AuthResponse registerUser(String email, String password, String name) throws Exception {
        MvcResult result =
                mockMvc.perform(
                                post("/api/auth/register")
                                        .header("X-API-Key", API_KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                objectMapper.writeValueAsString(
                                                        registerRequest(email, password, name))))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.success").value(true))
                        .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return objectMapper.treeToValue(root.get("data"), AuthResponse.class);
    }

    // -- API Key tests --

    @Test
    void request_WithoutApiKey_ShouldReturn401() throws Exception {
        RegisterRequest request = registerRequest("test@example.com", "password123!", "Test");
        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void request_WithInvalidApiKey_ShouldReturn401() throws Exception {
        RegisterRequest request = registerRequest("test@example.com", "password123!", "Test");
        mockMvc.perform(
                        post("/api/auth/register")
                                .header("X-API-Key", "wrong-key")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // -- Register tests --

    @Test
    void register_Success() throws Exception {
        AuthResponse response = registerUser("new@example.com", "SecurePass123!", "New User");
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("new@example.com", response.getUser().getEmail());
        assertTrue(userRepository.existsByEmail("new@example.com"));
    }

    @Test
    void register_DuplicateEmail_Returns409() throws Exception {
        registerUser("dup@example.com", "SecurePass123!", "First");

        RegisterRequest second = registerRequest("dup@example.com", "AnotherPass123!", "Second");
        mockMvc.perform(
                        post("/api/auth/register")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    void register_MissingFields_Returns400() throws Exception {
        RegisterRequest incomplete = new RegisterRequest();
        incomplete.setEmail("bad@example.com");
        mockMvc.perform(
                        post("/api/auth/register")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(incomplete)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    // -- Login tests --

    @Test
    void login_Success() throws Exception {
        registerUser("login@example.com", "TestPass123!", "Login Test");

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("login@example.com");
        loginReq.setPassword("TestPass123!");

        mockMvc.perform(
                        post("/api/auth/login")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.user.email").value("login@example.com"));
    }

    @Test
    void login_WrongPassword_Returns401() throws Exception {
        registerUser("wrong@example.com", "CorrectPass123!", "Wrong");

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("wrong@example.com");
        loginReq.setPassword("WrongPassword123!");

        mockMvc.perform(
                        post("/api/auth/login")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void login_NonExistentEmail_Returns401() throws Exception {
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("ghost@example.com");
        loginReq.setPassword("password123!");

        mockMvc.perform(
                        post("/api/auth/login")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // -- Refresh tests --

    @Test
    void refresh_Success() throws Exception {
        AuthResponse auth = registerUser("refresh@example.com", "RefreshPass123!", "Refresh");

        RefreshTokenRequest refreshReq = new RefreshTokenRequest();
        refreshReq.setRefreshToken(auth.getRefreshToken());

        mockMvc.perform(
                        post("/api/auth/refresh")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").value(auth.getRefreshToken()));
    }

    @Test
    void refresh_InvalidToken_Returns401() throws Exception {
        RefreshTokenRequest refreshReq = new RefreshTokenRequest();
        refreshReq.setRefreshToken("invalid_token");

        mockMvc.perform(
                        post("/api/auth/refresh")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // -- Logout tests --

    @Test
    void logout_WithJwt_ShouldRevokeToken() throws Exception {
        AuthResponse auth = registerUser("logout@example.com", "LogoutPass123!", "Logout");

        RefreshTokenRequest logoutReq = new RefreshTokenRequest();
        logoutReq.setRefreshToken(auth.getRefreshToken());

        mockMvc.perform(
                        post("/api/auth/logout")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", "Bearer " + auth.getAccessToken())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify refresh token no longer works
        RefreshTokenRequest refreshReq = new RefreshTokenRequest();
        refreshReq.setRefreshToken(auth.getRefreshToken());

        mockMvc.perform(
                        post("/api/auth/refresh")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // -- Me endpoint tests --

    @Test
    void me_WithJwt_ReturnsUserInfo() throws Exception {
        AuthResponse auth = registerUser("me@example.com", "MePassword123!", "Me Test");

        mockMvc.perform(
                        get("/api/auth/me")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", "Bearer " + auth.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("me@example.com"))
                .andExpect(jsonPath("$.data.displayName").value("Me Test"));
    }

    @Test
    void me_WithoutJwt_Returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("X-API-Key", API_KEY))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    // -- Forgot password tests --

    private ForgotPasswordRequest forgotRequest(String email) {
        ForgotPasswordRequest r = new ForgotPasswordRequest();
        r.setEmail(email);
        return r;
    }

    @Test
    void forgotPassword_UnknownEmail_ReturnsGeneric200() throws Exception {
        mockMvc.perform(
                        post("/api/auth/forgot-password")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                forgotRequest("ghost@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").exists());

        // Email must NOT be dispatched for unknown recipients.
        org.mockito.Mockito.verifyNoInteractions(emailService);
    }

    @Test
    void forgotPassword_KnownEmail_PersistsTokenAndTriggersEmail() throws Exception {
        registerUser("forgot@example.com", "FirstPass123!", "Forgot User");

        mockMvc.perform(
                        post("/api/auth/forgot-password")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                forgotRequest("forgot@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertEquals(1, passwordResetTokenRepository.count(), "one reset token should exist");
        org.mockito.Mockito.verify(emailService)
                .sendPasswordResetEmail(
                        org.mockito.ArgumentMatchers.eq("forgot@example.com"),
                        org.mockito.ArgumentMatchers.eq("Forgot User"),
                        org.mockito.ArgumentMatchers.startsWith("cookmate://reset?token="));
    }

    @Test
    void forgotPassword_InvalidEmailFormat_Returns400() throws Exception {
        mockMvc.perform(
                        post("/api/auth/forgot-password")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                forgotRequest("not-an-email"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    // -- Reset password tests --

    private ResetPasswordRequest resetRequest(String token, String newPassword) {
        ResetPasswordRequest r = new ResetPasswordRequest();
        r.setToken(token);
        r.setNewPassword(newPassword);
        return r;
    }

    @Test
    void resetPassword_InvalidToken_Returns400() throws Exception {
        mockMvc.perform(
                        post("/api/auth/reset-password")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                resetRequest("not-a-real-token", "NewPass123!"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RESET_TOKEN_INVALID"));
    }

    @Test
    void resetPassword_TooShortPassword_Returns400() throws Exception {
        mockMvc.perform(
                        post("/api/auth/reset-password")
                                .header("X-API-Key", API_KEY)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                resetRequest("anything", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }
}
