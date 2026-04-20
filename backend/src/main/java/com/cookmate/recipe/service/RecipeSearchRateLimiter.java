package com.cookmate.recipe.service;

import com.cookmate.shared.ratelimit.SlidingWindowRateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Thin Spring bean wrapping {@link SlidingWindowRateLimiter} for the recipe search endpoint. Config
 * knobs: {@code app.recipe-search.rate-limit.max-requests} (default 60) per {@code
 * app.recipe-search.rate-limit.window-seconds} (default 60).
 */
@Component
public class RecipeSearchRateLimiter {

    private final SlidingWindowRateLimiter delegate;

    public RecipeSearchRateLimiter(
            @Value("${app.recipe-search.rate-limit.max-requests:60}") int maxRequests,
            @Value("${app.recipe-search.rate-limit.window-seconds:60}") long windowSeconds) {
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
