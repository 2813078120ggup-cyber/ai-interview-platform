package com.gc.aiinterview.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({StorageProperties.class, DeepSeekProperties.class})
public class AiIntegrationConfig {
}
