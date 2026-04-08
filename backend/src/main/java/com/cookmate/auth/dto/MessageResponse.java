package com.cookmate.auth.dto;

/**
 * Generic response carrying a user-facing message. Used by endpoints that do not need to return any
 * other data (e.g., forgot/reset password).
 */
public record MessageResponse(String message) {

    public static MessageResponse of(String message) {
        return new MessageResponse(message);
    }
}
