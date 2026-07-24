package com.tyut.aiinterview.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import com.tyut.aiinterview.ai.config.AiConfig;
import com.tyut.aiinterview.ai.dto.ChatMessage;
import com.tyut.aiinterview.ai.dto.ChatRequest;
import com.tyut.aiinterview.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class LlmClient {

    private final AiConfig aiConfig;
    private final ObjectMapper objectMapper;

    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");

    public String chat(List<ChatMessage> messages) {
        return chat(messages, aiConfig.getMaxTokens(), 0.7);
    }

    public String chat(List<ChatMessage> messages, int maxTokens, double temperature) {
        try {
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(aiConfig.getTimeout(), java.util.concurrent.TimeUnit.MILLISECONDS)
                    .readTimeout(aiConfig.getTimeout(), java.util.concurrent.TimeUnit.MILLISECONDS)
                    .writeTimeout(aiConfig.getTimeout(), java.util.concurrent.TimeUnit.MILLISECONDS)
                    .build();

            ChatRequest request = ChatRequest.builder()
                    .model(aiConfig.getModel())
                    .messages(messages)
                    .maxTokens(maxTokens)
                    .temperature(temperature)
                    .build();

            String json = objectMapper.writeValueAsString(request);
            RequestBody body = RequestBody.create(json, JSON_MEDIA_TYPE);

            Request httpRequest = new Request.Builder()
                    .url(aiConfig.getBaseUrl() + "/chat/completions")
                    .header("Authorization", "Bearer " + aiConfig.getApiKey())
                    .header("Content-Type", "application/json")
                    .post(body)
                    .build();

            try (Response response = client.newCall(httpRequest).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("LLM API request failed: " + response.code());
                }
                String responseBody = response.body().string();
                ChatResponse chatResponse = objectMapper.readValue(responseBody, ChatResponse.class);
                String content = chatResponse.getContent();
                log.debug("LLM response received, tokens used: {}", chatResponse.getUsage() != null ? chatResponse.getUsage().getTotalTokens() : 0);
                return content;
            }
        } catch (Exception e) {
            log.error("LLM client error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to call LLM API", e);
        }
    }

    public String chatWithSystemPrompt(String systemPrompt, String userPrompt) {
        List<ChatMessage> messages = List.of(
                ChatMessage.system(systemPrompt),
                ChatMessage.user(userPrompt)
        );
        return chat(messages);
    }
}
