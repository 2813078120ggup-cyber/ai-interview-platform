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

    /**
     * Browser-safe configuration for the official iFlytek Web SDK. The API
     * secret is deliberately never returned to the browser.
     */
    public record SdkConfigResponse(
            boolean enabled,
            String provider,
            String status,
            String message,
            String signedUrl,
            String appId,
            String sceneId,
            String avatarId,
            String vcn,
            String protocol
    ) {
    }

    public record StopRequest(
            @NotBlank(message = "虚拟人会话 ID 不能为空") String sessionId
    ) {
    }
}
