package com.tyut.aiinterview.virtualhuman;

import jakarta.validation.constraints.NotBlank;

public final class VirtualHumanDtos {
    private VirtualHumanDtos() {
    }

    public record SpeakRequest(
            @NotBlank(message = "播报文本不能为空") String text,
            String sessionId,
            String interviewQuestionId
    ) {
    }

    public record SpeakResponse(
            boolean enabled,
            String provider,
            String mode,
            String status,
            String message,
            String sessionId,
            String streamUrl,
            String fallbackText
    ) {
    }
}
