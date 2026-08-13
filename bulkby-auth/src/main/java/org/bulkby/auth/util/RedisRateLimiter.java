package org.bulkby.auth.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Redis-based rate limiter for OTP and auth endpoints. Works across multiple instances.
 * On Redis errors, denies the request (fail closed) to be safe.
 */
@Component
public class RedisRateLimiter {

    private static final Logger logger = LoggerFactory.getLogger(RedisRateLimiter.class);
    private static final String KEY_PREFIX = "ratelimit:otp:";

    private final RedisTemplate<String, String> redisTemplate;
    private final int maxRequests;
    private final long windowMs;

    public RedisRateLimiter(
            RedisTemplate<String, String> redisTemplate,
            @Value("${app.rate-limit.otp.max-requests:5}") int maxRequests,
            @Value("${app.rate-limit.otp.window-ms:60000}") long windowMs) {
        this.redisTemplate = redisTemplate;
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    /**
     * Check if a request is allowed for the given key.
     *
     * @param key The key to rate limit (e.g. IP, contact value)
     * @return true if allowed, false if rate limit exceeded or Redis error (fail closed)
     */
    public boolean isAllowed(String key) {
        String redisKey = KEY_PREFIX + key;
        try {
            Boolean set = redisTemplate.opsForValue().setIfAbsent(redisKey, "1", windowMs, TimeUnit.MILLISECONDS);
            if (Boolean.TRUE.equals(set)) {
                return true; // First request in window
            }
            Long count = redisTemplate.opsForValue().increment(redisKey);
            if (count == null) {
                return false;
            }
            return count <= maxRequests;
        } catch (Exception e) {
            logger.warn("Redis rate limit check failed for key {}: {}", key, e.getMessage());
            return false;
        }
    }

    /**
     * Get remaining requests in the current window for the key.
     *
     * @param key The key to check
     * @return Remaining requests, or 0 on error
     */
    public int getRemainingRequests(String key) {
        String redisKey = KEY_PREFIX + key;
        try {
            String val = redisTemplate.opsForValue().get(redisKey);
            if (val == null) {
                return maxRequests;
            }
            int count = Integer.parseInt(val);
            int remaining = maxRequests - count;
            return Math.max(0, remaining);
        } catch (Exception e) {
            logger.warn("Redis rate limit get remaining failed for key {}: {}", key, e.getMessage());
            return 0;
        }
    }
}
