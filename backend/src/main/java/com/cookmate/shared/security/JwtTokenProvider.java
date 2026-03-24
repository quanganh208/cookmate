package com.cookmate.shared.security;

import com.cookmate.auth.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenExpiration;

    private static final int MIN_SECRET_LENGTH = 64;

    public JwtTokenProvider(
            @Value("${app.auth.jwt.secret}") String secret,
            @Value("${app.auth.jwt.access-token-expiration}") long accessTokenExpiration) {
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalArgumentException(
                    "JWT secret must be at least "
                            + MIN_SECRET_LENGTH
                            + " characters for HMAC-SHA512");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
    }

    /** Generate a short-lived JWT access token with user claims. */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim(
                        "roles",
                        user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /** Generate a random refresh token string (not JWT — stored in DB). */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    /** Validate a JWT token. Returns true if valid and not expired. */
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Extract the user ID (subject) from a valid JWT token. */
    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return claims.getSubject();
    }
}
