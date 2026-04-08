package com.cookmate.auth.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Authentication / authorization related exception with an explicit error {@link #code} that is
 * surfaced to clients via the {@code ApiResponse.error.code} envelope field. The code is meant to
 * be machine-readable (e.g., {@code BAD_CREDENTIALS}) so the mobile error mapper can surface
 * localised messages without parsing the HTTP status name.
 */
@Getter
public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AuthException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static AuthException badCredentials() {
        return new AuthException(
                "Invalid email or password", HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS");
    }

    public static AuthException emailTaken() {
        return new AuthException("Email already registered", HttpStatus.CONFLICT, "EMAIL_TAKEN");
    }

    public static AuthException invalidToken() {
        return new AuthException(
                "Invalid or expired token", HttpStatus.UNAUTHORIZED, "INVALID_TOKEN");
    }

    public static AuthException oauthOnly() {
        return new AuthException("Account uses OAuth login", HttpStatus.BAD_REQUEST, "OAUTH_ONLY");
    }

    public static AuthException emailExistsWithPassword() {
        return new AuthException(
                "Email already registered with password. Please login with your password.",
                HttpStatus.CONFLICT,
                "EMAIL_EXISTS_WITH_PASSWORD");
    }

    public static AuthException resetTokenInvalid() {
        return new AuthException(
                "Invalid password reset token", HttpStatus.BAD_REQUEST, "RESET_TOKEN_INVALID");
    }

    public static AuthException resetTokenExpired() {
        return new AuthException(
                "Password reset token has expired", HttpStatus.BAD_REQUEST, "RESET_TOKEN_EXPIRED");
    }

    public static AuthException resetRateLimited() {
        return new AuthException(
                "Too many password reset requests. Please try again later.",
                HttpStatus.TOO_MANY_REQUESTS,
                "RESET_RATE_LIMITED");
    }
}
