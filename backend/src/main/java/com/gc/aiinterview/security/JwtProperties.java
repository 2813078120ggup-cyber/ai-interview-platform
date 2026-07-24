package com.gc.aiinterview.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.security")
public class JwtProperties {
    private String jwtSecret;
    private long tokenExpireHours = 24;
    private long refreshTokenExpireDays = 14;
}
