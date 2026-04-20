package com.cookmate.collection.service;

import com.cookmate.shared.ratelimit.SlidingWindowRateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Sliding-window rate limiter for favorites write endpoints (save / unsave). Default 60 requests
 * per 60-second window per user — prevents accidental double-tap storms and cheap abuse. Mirrors
 * {@link com.cookmate.recipe.service.RecipeSearchRateLimiter}.
 */
@Component
public class FavoritesRateLimiter {

    private final SlidingWindowRateLimiter delegate;

    public FavoritesRateLimiter(
            @Value("${app.favorites.rate-limit.max-requests:60}") int maxRequests,
            @Value("${app.favorites.rate-limit.window-seconds:60}") long windowSeconds) {
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
