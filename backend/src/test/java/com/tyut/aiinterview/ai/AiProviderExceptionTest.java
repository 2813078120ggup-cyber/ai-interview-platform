package com.tyut.aiinterview.ai;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AiProviderExceptionTest {

    @Test
    void retriesNetworkRateLimitAndServerFailures() {
        assertTrue(new AiProviderException("connection failure", new RuntimeException()).retryable());
        assertTrue(new AiProviderException(429, "rate limited").retryable());
        assertTrue(new AiProviderException(503, "unavailable").retryable());
    }

    @Test
    void doesNotRetryPermanentClientFailures() {
        assertFalse(new AiProviderException(400, "invalid request").retryable());
        assertFalse(new AiProviderException(401, "unauthorized").retryable());
        assertFalse(new AiProviderException(403, "forbidden").retryable());
    }
}
