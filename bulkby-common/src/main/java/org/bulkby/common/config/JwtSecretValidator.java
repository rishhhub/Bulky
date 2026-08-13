package org.bulkby.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Fails application startup in production if JWT secret is missing, default (dev) value, or too short.
 * HMAC-SHA256 requires at least 256 bits (32 bytes).
 */
@Component
@Profile("prod")
public class JwtSecretValidator implements ApplicationRunner {

    private static final String DEFAULT_DEV_SECRET = "your-256-bit-secret-key-change-this-in-production-to-a-very-long-random-string";
    private static final int MIN_SECRET_BYTES = 32;

    @Value("${jwt.secret:}")
    private String secret;

    public JwtSecretValidator() {
    }

    @Override
    public void run(ApplicationArguments args) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "Production startup aborted: JWT_SECRET is not set. Set the JWT_SECRET environment variable to a secure random string of at least 32 bytes.");
        }
        if (DEFAULT_DEV_SECRET.equals(secret.trim())) {
            throw new IllegalStateException(
                "Production startup aborted: JWT_SECRET must not be the default development value. Set JWT_SECRET to a secure random string of at least 32 bytes.");
        }
        int lengthBytes = secret.getBytes(StandardCharsets.UTF_8).length;
        if (lengthBytes < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                String.format("Production startup aborted: JWT_SECRET must be at least %d bytes (got %d). Use a longer secure random string.", MIN_SECRET_BYTES, lengthBytes));
        }
    }
}
