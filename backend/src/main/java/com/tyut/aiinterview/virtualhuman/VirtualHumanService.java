package com.tyut.aiinterview.virtualhuman;

import com.tyut.aiinterview.settings.AiProviderService;
import org.springframework.stereotype.Service;

@Service
public class VirtualHumanService {
    private final AiProviderService aiProviderService;
    private final XunfeiVirtualHumanClient xunfeiClient;

    public VirtualHumanService(AiProviderService aiProviderService, XunfeiVirtualHumanClient xunfeiClient) {
        this.aiProviderService = aiProviderService;
        this.xunfeiClient = xunfeiClient;
    }

    public VirtualHumanDtos.SpeakResponse speak(VirtualHumanDtos.SpeakRequest request) {
        return aiProviderService.defaultVirtualHumanProvider()
                .map(provider -> drive(provider, request))
                .orElseGet(() -> fallback("未启用虚拟人 Provider，已降级为本地数字人与浏览器朗读", request.text()));
    }

    private VirtualHumanDtos.SpeakResponse drive(AiProviderService.RuntimeProvider provider, VirtualHumanDtos.SpeakRequest request) {
        if (!isConfigured(provider)) {
            return fallback("虚拟人 Provider 配置不完整，请在系统设置中补齐 Base URL、AppID、API Key、API Secret 和 avatarId", request.text());
        }
        if (!provider.code().toLowerCase().contains("xunfei")) {
            return fallback("当前虚拟人 Provider 不是讯飞适配类型，已降级为本地数字人", request.text());
        }
        try {
            String sessionId = request.sessionId() == null ? "" : request.sessionId().trim();
            String streamUrl = "";
            if (sessionId.isBlank()) {
                XunfeiVirtualHumanClient.SessionResult session = xunfeiClient.start(provider);
                sessionId = session.sessionId();
                streamUrl = session.streamUrl();
            }
            if (sessionId.isBlank()) {
                return fallback("讯飞虚拟人未返回会话 ID，已降级为本地数字人", request.text());
            }
            xunfeiClient.control(provider, sessionId, request.text());
            boolean hasStream = !streamUrl.isBlank();
            return new VirtualHumanDtos.SpeakResponse(
                    hasStream,
                    provider.name(),
                    "xunfei-virtual-human",
                    hasStream ? "SPEAKING" : "NO_STREAM",
                    hasStream ? "讯飞虚拟人会话已启动" : "讯飞虚拟人已接收播报文本，但没有返回可播放视频流，已使用本地语音兜底",
                    sessionId,
                    streamUrl,
                    request.text()
            );
        } catch (Exception exception) {
            return fallback("讯飞虚拟人调用失败，已降级为本地数字人：" + shortMessage(exception), request.text());
        }
    }

    private boolean isConfigured(AiProviderService.RuntimeProvider provider) {
        return !provider.baseUrl().isBlank()
                && !provider.baseUrl().contains("待配置")
                && !provider.serviceId().isBlank()
                && !provider.serviceId().contains("待配置")
                && !provider.appId().isBlank()
                && !provider.apiKey().isBlank()
                && !provider.apiSecret().isBlank()
                && !provider.avatarModel().isBlank()
                && !provider.avatarModel().contains("待配置");
    }

    private VirtualHumanDtos.SpeakResponse fallback(String message, String text) {
        return new VirtualHumanDtos.SpeakResponse(false, "local-avatar", "browser-tts", "FALLBACK", message, "", "", text);
    }

    private String shortMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) return exception.getClass().getSimpleName();
        return message.length() > 180 ? message.substring(0, 180) : message;
    }
}
