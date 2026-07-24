package com.tyut.aiinterview.security;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.security.auth-rate-limit")
public record AuthRateLimitProperties(
        @Min(value = 1, message = "认证限流最大次数必须大于 0") int maxAttempts,
        @Min(value = 1, message = "认证限流窗口时间必须大于 0") long windowSeconds) {
}
