package com.tyut.aiinterview.virtualhuman;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tyut.aiinterview.settings.AiProviderService;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class XunfeiVirtualHumanClient {
    private static final String START_PATH = "/v1/private/vms2d_start";
    private static final String CTRL_PATH = "/v1/private/vms2d_ctrl";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();

    public XunfeiVirtualHumanClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public SessionResult start(AiProviderService.RuntimeProvider provider) throws Exception {
        Map<String, Object> vmr = new LinkedHashMap<>();
        vmr.put("avatar_id", provider.avatarModel());
        vmr.put("service_id", provider.serviceId());
        vmr.put("width", 1280);
        vmr.put("height", 720);
        vmr.put("protocol", "rtmp");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("header", Map.of("app_id", provider.appId(), "status", 3));
        body.put("parameter", Map.of("vmr", vmr));
        JsonNode response = send(provider, START_PATH, body);

        String sessionId = firstText(response, "session_id", "sessionId", "sid").orElse("");
        String streamUrl = firstText(response, "stream_url", "streamUrl", "play_url", "playUrl", "url").orElse("");
        return new SessionResult(sessionId, streamUrl, response.toString());
    }

    public JsonNode control(AiProviderService.RuntimeProvider provider, String sessionId, String text) throws Exception {
        Map<String, Object> textPayload = new LinkedHashMap<>();
        textPayload.put("encoding", "utf8");
        textPayload.put("status", 3);
        textPayload.put("text", Base64.getEncoder().encodeToString(text.getBytes(StandardCharsets.UTF_8)));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("header", Map.of("app_id", provider.appId(), "session_id", sessionId, "status", 3));
        body.put("parameter", Map.of(
                "tts", Map.of("vcn", provider.voiceModel().isBlank() ? "x4_lingxiaoxuan_oral" : provider.voiceModel()),
                "vmr", Map.of("service_id", provider.serviceId(), "avatar_id", provider.avatarModel())
        ));
        body.put("payload", Map.of("text", textPayload));
        return send(provider, CTRL_PATH, body);
    }

    private JsonNode send(AiProviderService.RuntimeProvider provider, String path, Map<String, Object> body) throws Exception {
        URI uri = endpoint(provider.baseUrl(), path);
        String payload = objectMapper.writeValueAsString(body);
        HttpRequest request = HttpRequest.newBuilder(authorizedUri(uri, provider.apiKey(), provider.apiSecret()))
                .timeout(Duration.ofSeconds(18))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode node = objectMapper.readTree(response.body().isBlank() ? "{}" : response.body());
        if (response.statusCode() < 200 || response.statusCode() >= 300 || responseCode(node) != 0) {
            throw new IllegalStateException("讯飞虚拟人接口返回异常：" + response.statusCode() + " / " + responseCode(node));
        }
        return node;
    }

    private URI endpoint(String baseUrl, String path) {
        String root = baseUrl == null ? "" : baseUrl.trim();
        if (root.isBlank()) root = "https://vms.cn-huadong-1.xf-yun.com";
        root = root.replaceAll("/+$", "");
        root = root.replace("/v1/private/vms2d_start", "").replace("/v1/private/vms2d_ctrl", "");
        return URI.create(root + path);
    }

    private URI authorizedUri(URI uri, String apiKey, String apiSecret) throws Exception {
        String host = uri.getHost();
        String date = DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now(ZoneOffset.UTC));
        String signatureOrigin = "host: " + host + "\n" +
                "date: " + date + "\n" +
                "POST " + uri.getPath() + " HTTP/1.1";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = Base64.getEncoder().encodeToString(mac.doFinal(signatureOrigin.getBytes(StandardCharsets.UTF_8)));
        String authorizationOrigin = "api_key=\"" + apiKey + "\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"" + signature + "\"";
        String authorization = Base64.getEncoder().encodeToString(authorizationOrigin.getBytes(StandardCharsets.UTF_8));
        String query = "authorization=" + encode(authorization) + "&date=" + encode(date) + "&host=" + encode(host);
        return URI.create(uri.toString() + "?" + query);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private int responseCode(JsonNode node) {
        JsonNode headerCode = node.at("/header/code");
        if (headerCode.isNumber()) return headerCode.asInt();
        JsonNode code = node.get("code");
        return code != null && code.isNumber() ? code.asInt() : 0;
    }

    private Optional<String> firstText(JsonNode node, String... names) {
        for (String name : names) {
            Optional<String> found = findText(node, name);
            if (found.isPresent()) return found;
        }
        return Optional.empty();
    }

    private Optional<String> findText(JsonNode node, String name) {
        if (node == null || node.isNull()) return Optional.empty();
        JsonNode direct = node.get(name);
        if (direct != null && direct.isTextual() && !direct.asText().isBlank()) return Optional.of(direct.asText());
        if (node.isContainerNode()) {
            for (JsonNode child : node) {
                Optional<String> found = findText(child, name);
                if (found.isPresent()) return found;
            }
        }
        return Optional.empty();
    }

    public record SessionResult(String sessionId, String streamUrl, String rawPayload) {
    }
}
