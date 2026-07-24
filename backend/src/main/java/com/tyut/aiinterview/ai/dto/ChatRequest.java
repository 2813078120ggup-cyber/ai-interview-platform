package com.tyut.aiinterview.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    private String model;
    private List<ChatMessage> messages;
    private Integer maxTokens;
    private Double temperature;
    private String responseFormat;
}
