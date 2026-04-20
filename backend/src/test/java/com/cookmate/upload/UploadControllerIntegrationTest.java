package com.cookmate.upload;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.cookmate.auth.dto.AuthResponse;
import com.cookmate.auth.dto.RegisterRequest;
import com.cookmate.auth.repository.RefreshTokenRepository;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.shared.service.EmailService;
import com.cookmate.upload.model.PendingUpload;
import com.cookmate.upload.repository.PendingUploadRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

/**
 * Upload endpoint integration tests with a mocked {@link S3Client} — no Testcontainers /
 * LocalStack. Exercises JWT gating, Tika MIME detection, polyglot/SVG rejection, X-Upload-Id
 * idempotency, rate-limit, size cap, and PendingUpload persistence.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@TestPropertySource(
        properties = {
            "spring.data.mongodb.uri=mongodb://localhost:27017/cookmate-test",
            "app.upload.rate-limit.max-requests=3",
            "app.upload.rate-limit.window-seconds=3600",
            "app.r2.public-url=http://fake-r2.local/test-bucket"
        })
class UploadControllerIntegrationTest {

    private static final String API_KEY = "dev-api-key-change-in-production";

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private PendingUploadRepository pendingUploadRepository;
    @Autowired private UploadRateLimiter rateLimiter;

    @MockitoBean private EmailService emailService;
    @MockitoBean private S3Client s3Client;

    private MockMvc mockMvc;
    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc =
                MockMvcBuilders.webAppContextSetup(webApplicationContext)
                        .apply(springSecurity())
                        .build();
        rateLimiter.reset();
        pendingUploadRepository.deleteAll();
        userRepository.deleteAll();
        refreshTokenRepository.deleteAll();

        // Stub S3 PutObject to succeed silently.
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        accessToken = registerUser().getAccessToken();
    }

    private AuthResponse registerUser() throws Exception {
        RegisterRequest r = new RegisterRequest();
        r.setEmail("uploader@example.com");
        r.setPassword("SecurePass123!");
        r.setDisplayName("Uploader");
        MvcResult result =
                mockMvc.perform(
                                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                        .post("/api/auth/register")
                                        .header("X-API-Key", API_KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(r)))
                        .andExpect(status().isCreated())
                        .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return objectMapper.treeToValue(root.get("data"), AuthResponse.class);
    }

    private byte[] validPngBytes() throws Exception {
        BufferedImage img = new BufferedImage(16, 16, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < 16; x++) {
            for (int y = 0; y < 16; y++) {
                img.setRGB(x, y, Color.RED.getRGB());
            }
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    private String bearer() {
        return "Bearer " + accessToken;
    }

    @Test
    void upload_ValidPng_Returns200AndPersistsPendingUpload() throws Exception {
        MockMultipartFile file =
                new MockMultipartFile("file", "dish.png", "image/png", validPngBytes());

        MvcResult result =
                mockMvc.perform(
                                multipart("/api/uploads/image")
                                        .file(file)
                                        .header("X-API-Key", API_KEY)
                                        .header("Authorization", bearer())
                                        .header("X-Upload-Id", "u1"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.success").value(true))
                        .andExpect(
                                jsonPath(
                                        "$.data.url",
                                        org.hamcrest.Matchers.startsWith(
                                                "http://fake-r2.local/test-bucket/")))
                        .andReturn();

        assertEquals(1, pendingUploadRepository.count());
        PendingUpload stored = pendingUploadRepository.findByUploadId("u1").orElseThrow();
        assertNotNull(stored.getObjectKey());
        assertNull(stored.getLinkedToRecipeId());
        verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void upload_RetryWithSameUploadId_ReturnsCachedAndDoesNotHitR2Again() throws Exception {
        MockMultipartFile file =
                new MockMultipartFile("file", "dish.png", "image/png", validPngBytes());

        mockMvc.perform(
                        multipart("/api/uploads/image")
                                .file(file)
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer())
                                .header("X-Upload-Id", "retry-42"))
                .andExpect(status().isOk());
        mockMvc.perform(
                        multipart("/api/uploads/image")
                                .file(file)
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer())
                                .header("X-Upload-Id", "retry-42"))
                .andExpect(status().isOk());

        verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        assertEquals(1, pendingUploadRepository.count());
    }

    @Test
    void upload_Unauthenticated_Returns401() throws Exception {
        MockMultipartFile file =
                new MockMultipartFile("file", "dish.png", "image/png", validPngBytes());
        mockMvc.perform(multipart("/api/uploads/image").file(file).header("X-API-Key", API_KEY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void upload_SvgPayload_Returns415() throws Exception {
        String svg =
                "<?xml version=\"1.0\"?><svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>";
        MockMultipartFile file =
                new MockMultipartFile("file", "x.svg", "image/svg+xml", svg.getBytes());
        mockMvc.perform(
                        multipart("/api/uploads/image")
                                .file(file)
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer()))
                .andExpect(status().is(415));
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void upload_PolyglotGifPhp_Returns415() throws Exception {
        // "GIF89a" header followed by PHP — Tika detects as text/plain or octet-stream, not
        // allowed.
        byte[] polyglot = ("GIF89a<?php echo 'hi'; ?>").getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "bad.gif", "image/gif", polyglot);
        mockMvc.perform(
                        multipart("/api/uploads/image")
                                .file(file)
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer()))
                .andExpect(status().is(415));
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void upload_ExceedsRateLimit_Returns429() throws Exception {
        MockMultipartFile file =
                new MockMultipartFile("file", "dish.png", "image/png", validPngBytes());
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(
                            multipart("/api/uploads/image")
                                    .file(file)
                                    .header("X-API-Key", API_KEY)
                                    .header("Authorization", bearer())
                                    .header("X-Upload-Id", "up" + i))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(
                        multipart("/api/uploads/image")
                                .file(file)
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer())
                                .header("X-Upload-Id", "overflow"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }
}
