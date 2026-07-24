package com.tyut.aiinterview.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ai.llm")
public class AiConfig {

    private String apiKey;
    private String baseUrl;
    private String model;
    private int timeout;
    private int maxTokens;
}
