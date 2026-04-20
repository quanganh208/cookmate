package com.cookmate.upload;

import com.cookmate.shared.ratelimit.SlidingWindowRateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Sliding-window rate limiter for image uploads. Defaults to 20 uploads per hour per user — enough
 * for a burst of real form submissions, tight enough to deter abuse.
 */
@Component
public class UploadRateLimiter {

    private final SlidingWindowRateLimiter delegate;

    public UploadRateLimiter(
            @Value("${app.upload.rate-limit.max-requests:20}") int maxRequests,
            @Value("${app.upload.rate-limit.window-seconds:3600}") long windowSeconds) {
        this.delegate = new SlidingWindowRateLimiter(maxRequests, windowSeconds);
    }

    public boolean tryAcquire(String key) {
        return delegate.tryAcquire(key);
    }

    /** Test-only hook — clears all buckets so tests don't leak state. */
    public void reset() {
        delegate.reset();
    }
}
