package com.tyut.aiinterview.virtualhuman;

import com.tyut.aiinterview.settings.AiProviderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Configuration boundary for the iFlytek Web SDK.
 * Live start/text/ASR/stop are deliberately owned by the browser SDK so one
 * interview corresponds to exactly one iFlytek session.
 */
@Service
public class VirtualHumanService {
    private static final Logger log = LoggerFactory.getLogger(VirtualHumanService.class);
    private static final String XUNFEI_PROVIDER_CODE = "xunfei-virtual-human";
    private final AiProviderService aiProviderService;
    private final XunfeiVirtualHumanClient xunfeiClient;

    public VirtualHumanService(AiProviderService aiProviderService, XunfeiVirtualHumanClient xunfeiClient) {
        this.aiProviderService = aiProviderService;
        this.xunfeiClient = xunfeiClient;
    }

    public VirtualHumanDtos.SdkConfigResponse sdkConfig() {
        return aiProviderService.defaultVirtualHumanProvider()
                .filter(this::isConfigured)
                .filter(provider -> provider.code().toLowerCase().contains("xunfei"))
                .map(provider -> {
                    try {
                        XunfeiVirtualHumanClient.WebSdkConfig config = xunfeiClient.webSdkConfig(provider);
                        log.info("Preparing iFlytek Web SDK session with providerCode={}, providerId={}, sceneId={}, avatarId={}, vcn={}, protocol={}",
                                provider.code(), provider.id(), config.sceneId(), config.avatarId(), config.vcn(), config.protocol());
                        return new VirtualHumanDtos.SdkConfigResponse(
                                true, provider.name(), "READY", "讯飞 Web SDK 配置已就绪。",
                                config.signedUrl(), config.appId(), config.sceneId(), config.avatarId(), config.vcn(), config.protocol());
                    } catch (Exception exception) {
                        return unavailable("讯飞 SDK 签名生成失败：" + shortMessage(exception));
                    }
                })
                .orElseGet(() -> unavailable("未找到已启用的讯飞虚拟人 Provider。请在系统设置中确认 Provider 编码为 "
                        + XUNFEI_PROVIDER_CODE + "，并完成同一接口服务下的 App ID、API Key、API Secret、接口服务 ID、形象 ID 与发音人配置。"));
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
                && !provider.avatarModel().contains("待配置")
                && !provider.voiceModel().isBlank()
                && !provider.voiceModel().contains("待配置");
    }

    private VirtualHumanDtos.SdkConfigResponse unavailable(String message) {
        return new VirtualHumanDtos.SdkConfigResponse(false, XUNFEI_PROVIDER_CODE, "UNAVAILABLE", message,
                "", "", "", "", "", "xrtc");
    }

    private String shortMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return exception.getClass().getSimpleName();
        }
        return message.length() > 180 ? message.substring(0, 180) : message;
    }
}
