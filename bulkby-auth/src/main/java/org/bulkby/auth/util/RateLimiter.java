package org.bulkby.auth.util;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter for OTP and authentication endpoints.
 * In production, consider using Redis-based rate limiting for distributed systems.
 */
public class RateLimiter {
    
    private static final int DEFAULT_MAX_REQUESTS = 5;
    private static final long DEFAULT_WINDOW_MS = 60_000; // 1 minute
    
    private final Map<String, RequestWindow> requestWindows = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowMs;
    
    public RateLimiter() {
        this(DEFAULT_MAX_REQUESTS, DEFAULT_WINDOW_MS);
    }
    
    public RateLimiter(int maxRequests, long windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    
    /**
     * Check if a request is allowed for the given key.
     * 
     * @param key The key to rate limit (e.g., IP address, user ID, contact value)
     * @return true if request is allowed, false if rate limit exceeded
     */
    public boolean isAllowed(String key) {
        long now = System.currentTimeMillis();
        RequestWindow window = requestWindows.computeIfAbsent(key, k -> new RequestWindow(now));
        
        // Reset window if expired
        if (now - window.startTime > windowMs) {
            window.startTime = now;
            window.requestCount.set(0);
        }
        
        // Check if limit exceeded
        int currentCount = window.requestCount.incrementAndGet();
        return currentCount <= maxRequests;
    }
    
    /**
     * Get remaining requests in current window.
     * 
     * @param key The key to check
     * @return Number of remaining requests, or 0 if limit exceeded
     */
    public int getRemainingRequests(String key) {
        long now = System.currentTimeMillis();
        RequestWindow window = requestWindows.get(key);
        
        if (window == null) {
            return maxRequests;
        }
        
        // Reset window if expired
        if (now - window.startTime > windowMs) {
            return maxRequests;
        }
        
        int remaining = maxRequests - window.requestCount.get();
        return Math.max(0, remaining);
    }
    
    /**
     * Clear rate limit for a key (useful for testing or manual reset).
     */
    public void clear(String key) {
        requestWindows.remove(key);
    }
    
    /**
     * Clear all rate limits (useful for testing).
     */
    public void clearAll() {
        requestWindows.clear();
    }
    
    private static class RequestWindow {
        volatile long startTime;
        final AtomicInteger requestCount;
        
        RequestWindow(long startTime) {
            this.startTime = startTime;
            this.requestCount = new AtomicInteger(0);
        }
    }
}
