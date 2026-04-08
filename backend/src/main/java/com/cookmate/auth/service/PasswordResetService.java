package com.cookmate.auth.service;

import com.cookmate.auth.exception.AuthException;
import com.cookmate.auth.model.AuthProvider;
import com.cookmate.auth.model.PasswordResetToken;
import com.cookmate.auth.model.User;
import com.cookmate.auth.repository.PasswordResetTokenRepository;
import com.cookmate.auth.repository.RefreshTokenRepository;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.shared.service.EmailService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Deque;
import java.util.Iterator;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Password reset flow. Generates cryptographically random tokens, stores only their SHA-256 hash,
 * enforces a 15-minute TTL via MongoDB index, and revokes all refresh tokens on successful reset.
 *
 * <p>A simple in-memory rate limiter caps requests per email to {@code rateLimitMaxRequests} within
 * {@code rateLimitWindowMinutes}. This is acceptable for a single-instance MVP deployment;
 * multi-instance setups should swap this for Redis (documented in phase file).
 */
@Slf4j
@Service
public class PasswordResetService {

    private static final int TOKEN_BYTE_LENGTH = 32;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    private final int tokenTtlMinutes;
    private final String resetBaseUrl;
    private final int rateLimitMaxRequests;
    private final int rateLimitWindowMinutes;

    /** email -> recent request timestamps (pruned on each check). */
    private final ConcurrentHashMap<String, Deque<Instant>> rateLimitBuckets =
            new ConcurrentHashMap<>();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${app.password-reset.token-ttl-minutes:15}") int tokenTtlMinutes,
            @Value("${app.password-reset.base-url:cookmate://reset}") String resetBaseUrl,
            @Value("${app.password-reset.rate-limit.max-requests:3}") int rateLimitMaxRequests,
            @Value("${app.password-reset.rate-limit.window-minutes:60}")
                    int rateLimitWindowMinutes) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.tokenTtlMinutes = tokenTtlMinutes;
        this.resetBaseUrl = resetBaseUrl;
        this.rateLimitMaxRequests = rateLimitMaxRequests;
        this.rateLimitWindowMinutes = rateLimitWindowMinutes;
    }

    /**
     * Create a reset token and dispatch the reset email. Silently no-ops for unknown emails and
     * OAuth-only accounts so the public endpoint never leaks user existence.
     *
     * <p>Email address is normalised to lower-case before lookup and rate-limit bucketing to
     * prevent trivial case-based bypass (since the request validator only enforces format).
     *
     * @param email the address to send the reset link to
     */
    public void createResetToken(String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        Optional<User> maybeUser = userRepository.findByEmail(normalizedEmail);
        if (maybeUser.isEmpty()) {
            log.debug("Password reset requested for unknown email; silently skipping");
            return;
        }
        User user = maybeUser.get();
        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            log.debug(
                    "Password reset requested for OAuth user {}; silently skipping",
                    normalizedEmail);
            return;
        }

        if (!checkRateLimit(normalizedEmail)) {
            log.info("Password reset rate limit exceeded for {}", normalizedEmail);
            // Caller swallows the exception so the client still gets a generic response.
            throw AuthException.resetRateLimited();
        }

        String plaintext = generatePlaintextToken();
        String hash = sha256Hex(plaintext);
        Instant expireAt = Instant.now().plusSeconds((long) tokenTtlMinutes * 60L);

        PasswordResetToken token =
                PasswordResetToken.builder()
                        .tokenHash(hash)
                        .userId(user.getId())
                        .expireAt(expireAt)
                        .used(false)
                        .build();
        tokenRepository.save(token);

        String link =
                resetBaseUrl + (resetBaseUrl.contains("?") ? "&" : "?") + "token=" + plaintext;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getDisplayName(), link);
    }

    /**
     * Verify a plaintext reset token and apply the new password. On success all refresh tokens
     * belonging to the user are revoked so every device is forced to re-login.
     *
     * @throws AuthException {@code RESET_TOKEN_INVALID} or {@code RESET_TOKEN_EXPIRED} on failure
     */
    public void verifyAndReset(String plaintextToken, String newPassword) {
        String hash = sha256Hex(plaintextToken);
        PasswordResetToken token =
                tokenRepository.findByTokenHash(hash).orElseThrow(AuthException::resetTokenInvalid);

        if (token.isUsed()) {
            throw AuthException.resetTokenInvalid();
        }
        if (token.getExpireAt() == null || token.getExpireAt().isBefore(Instant.now())) {
            throw AuthException.resetTokenExpired();
        }

        User user =
                userRepository
                        .findById(token.getUserId())
                        .orElseThrow(AuthException::resetTokenInvalid);

        // Safety: OAuth-only accounts have no password to reset.
        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw AuthException.resetTokenInvalid();
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        // Force re-login on every device.
        refreshTokenRepository.deleteByUserId(user.getId());
        log.info("Password reset completed for user {}", user.getId());
    }

    /**
     * @return {@code true} if request is allowed, {@code false} if bucket is full.
     */
    private boolean checkRateLimit(String email) {
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds((long) rateLimitWindowMinutes * 60L);
        Deque<Instant> bucket =
                rateLimitBuckets.computeIfAbsent(email, k -> new ConcurrentLinkedDeque<>());
        synchronized (bucket) {
            Iterator<Instant> it = bucket.iterator();
            while (it.hasNext()) {
                if (it.next().isBefore(windowStart)) {
                    it.remove();
                }
            }
            if (bucket.size() >= rateLimitMaxRequests) {
                return false;
            }
            bucket.addLast(now);
            return true;
        }
    }

    private String generatePlaintextToken() {
        byte[] bytes = new byte[TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hashBytes.length * 2);
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is mandated by every JRE; this branch is unreachable.
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
