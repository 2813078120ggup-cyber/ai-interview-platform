package com.tyut.aiinterview.ai;

/**
 * A sanitized failure from an external AI provider. Provider response bodies
 * are intentionally excluded because they can be persisted in task metadata.
 */
public final class AiProviderException extends RuntimeException {
    private final Integer statusCode;

    public AiProviderException(Integer statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public AiProviderException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = null;
    }

    public boolean retryable() {
        return statusCode == null || statusCode == 429 || statusCode >= 500;
    }
}
