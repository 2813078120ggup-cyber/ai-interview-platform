package com.tyut.aiinterview.virtualhuman;

import com.tyut.aiinterview.settings.AiProviderService;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * Produces the short-lived signed URL consumed by the official iFlytek Web SDK.
 *
 * <p>The browser SDK is the only owner of a live avatar session. Keeping the
 * previous server WebSocket implementation here would create a second session
 * for the same candidate, consume an extra avatar route and make stop handling
 * unreliable. The API secret is intentionally used only in this class.</p>
 */
@Component
public class XunfeiVirtualHumanClient {
    private static final String DEFAULT_ENDPOINT = "wss://avatar.cn-huadong-1.xf-yun.com/v1/interact";
    private static final String DEFAULT_AVATAR_ID = "118801001";
    private static final String DEFAULT_VOICE_NAME = "x4_lingxiaoxuan_oral";

    public WebSdkConfig webSdkConfig(AiProviderService.RuntimeProvider provider) throws Exception {
        URI signedUri = authorizedUri(endpoint(provider.baseUrl()), provider.apiKey(), provider.apiSecret());
        return new WebSdkConfig(
                signedUri.toString(),
                provider.appId(),
                provider.serviceId(),
                normalizedAvatarId(provider.avatarModel()),
                normalizedVoice(provider.voiceModel()),
                "xrtc"
        );
    }

    private URI endpoint(String baseUrl) {
        String root = baseUrl == null ? "" : baseUrl.trim();
        if (root.isBlank() || root.contains("待配置")) {
            root = DEFAULT_ENDPOINT;
        }
        root = root.replace("vms.cn-huadong-1.xf-yun.com", "avatar.cn-huadong-1.xf-yun.com");
        if (root.startsWith("http://")) {
            root = "ws://" + root.substring("http://".length());
        }
        if (root.startsWith("https://")) {
            root = "wss://" + root.substring("https://".length());
        }
        root = root.replaceAll("/+$", "");
        root = root.replace("/v1/private/vms2d_start", "").replace("/v1/private/vms2d_ctrl", "");
        if (!root.endsWith("/v1/interact")) {
            root += "/v1/interact";
        }
        return URI.create(root);
    }

    private URI authorizedUri(URI uri, String apiKey, String apiSecret) throws Exception {
        String host = uri.getHost();
        String date = DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now(ZoneOffset.UTC));
        String signatureOrigin = "host: " + host + "\n"
                + "date: " + date + "\n"
                + "GET " + uri.getPath() + " HTTP/1.1";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = Base64.getEncoder().encodeToString(mac.doFinal(signatureOrigin.getBytes(StandardCharsets.UTF_8)));
        String authorizationOrigin = "api_key=\"" + apiKey
                + "\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\""
                + signature + "\"";
        String authorization = Base64.getEncoder().encodeToString(authorizationOrigin.getBytes(StandardCharsets.UTF_8));
        String query = "authorization=" + encode(authorization) + "&date=" + encode(date) + "&host=" + encode(host);
        return URI.create(uri + "?" + query);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String normalizedAvatarId(String avatarModel) {
        String value = avatarModel == null ? "" : avatarModel.trim();
        if (value.isBlank()) {
            return DEFAULT_AVATAR_ID;
        }
        int separator = value.indexOf(':');
        String normalized = separator >= 0 ? value.substring(separator + 1).trim() : value;
        return normalized.isBlank() ? DEFAULT_AVATAR_ID : normalized;
    }

    private String normalizedVoice(String voiceModel) {
        String value = voiceModel == null ? "" : voiceModel.trim();
        return value.isBlank() || value.contains("不支持") || value.contains("待配置")
                ? DEFAULT_VOICE_NAME
                : value;
    }

    public record WebSdkConfig(
            String signedUrl,
            String appId,
            String sceneId,
            String avatarId,
            String vcn,
            String protocol
    ) {
    }
}
