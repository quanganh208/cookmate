package com.cookmate.auth.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AuthException extends RuntimeException {

    private final HttpStatus status;

    public AuthException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public static AuthException badCredentials() {
        return new AuthException("Invalid email or password", HttpStatus.UNAUTHORIZED);
    }

    public static AuthException emailTaken() {
        return new AuthException("Email already registered", HttpStatus.CONFLICT);
    }

    public static AuthException invalidToken() {
        return new AuthException("Invalid or expired token", HttpStatus.UNAUTHORIZED);
    }

    public static AuthException oauthOnly() {
        return new AuthException("Account uses OAuth login", HttpStatus.BAD_REQUEST);
    }

    public static AuthException emailExistsWithPassword() {
        return new AuthException(
                "Email already registered with password. Please login with your password.",
                HttpStatus.CONFLICT);
    }
}
