package com.cookmate.shared.ratelimit;

import java.time.Instant;
import java.util.Deque;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Minimal in-memory sliding-window rate limiter. Same pattern as {@link
 * com.cookmate.auth.service.PasswordResetService} (Phase 3.5) — single-instance only, MVP-grade.
 * Swap for Redis/Bucket4j when we go multi-instance.
 *
 * <p>Thread-safe per bucket via {@code synchronized} block. Bucket map is unbounded in theory —
 * acceptable given a single process and realistic client counts; consider LRU eviction if this ever
 * changes.
 */
public class SlidingWindowRateLimiter {

    private final int maxRequests;
    private final long windowSeconds;
    private final ConcurrentHashMap<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();

    public SlidingWindowRateLimiter(int maxRequests, long windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
    }

    /** Test-only: clear all buckets. Not called from production code. */
    public void reset() {
        buckets.clear();
    }

    /**
     * @return {@code true} if the request is allowed, {@code false} if the bucket is full.
     */
    public boolean tryAcquire(String key) {
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(windowSeconds);
        Deque<Instant> bucket = buckets.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        synchronized (bucket) {
            Iterator<Instant> it = bucket.iterator();
            while (it.hasNext()) {
                if (it.next().isBefore(windowStart)) {
                    it.remove();
                }
            }
            if (bucket.size() >= maxRequests) {
                return false;
            }
            bucket.addLast(now);
            return true;
        }
    }
}
