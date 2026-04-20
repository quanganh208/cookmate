package com.cookmate.shared.exception;

/** Thrown when a client exceeds the configured rate limit. Mapped to 429 by the global handler. */
public class RateLimitedException extends RuntimeException {
    public RateLimitedException(String message) {
        super(message);
    }
}
