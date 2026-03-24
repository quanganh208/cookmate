package com.cookmate.shared.security;

import com.cookmate.shared.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Validates X-API-Key header on all requests except whitelisted paths. */
@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";

    /** Paths that bypass API key validation (Swagger, actuator, OpenAPI docs). */
    private static final Set<String> SKIP_PREFIXES =
            Set.of("/swagger-ui", "/v3/api-docs", "/actuator");

    private final String apiKey;
    private final ObjectMapper objectMapper;

    public ApiKeyFilter(@Value("${app.auth.api-key}") String apiKey, ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip Swagger UI root path
        if ("/".equals(path)) {
            return true;
        }
        return SKIP_PREFIXES.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String providedKey = request.getHeader(API_KEY_HEADER);

        if (providedKey == null || !constantTimeEquals(apiKey, providedKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(
                    response.getOutputStream(),
                    ApiResponse.error("UNAUTHORIZED", "Invalid or missing API key"));
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Constant-time comparison to prevent timing attacks. */
    private boolean constantTimeEquals(String expected, String provided) {
        return MessageDigest.isEqual(expected.getBytes(), provided.getBytes());
    }
}
