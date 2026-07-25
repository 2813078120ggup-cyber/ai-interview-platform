package com.tyut.aiinterview.virtualhuman;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tyut.aiinterview.settings.AiProviderService;
import jakarta.annotation.PreDestroy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class XunfeiVirtualHumanClient {
    private static final String DEFAULT_ENDPOINT = "wss://avatar.cn-huadong-1.xf-yun.com/v1/interact";
    private static final String DEFAULT_AVATAR_ID = "118801001";
    private static final String DEFAULT_VOICE_NAME = "x4_lingxiaoxuan_oral";
    private static final int WIDTH = 720;
    private static final int HEIGHT = 1280;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(runnable -> {
        Thread thread = new Thread(runnable, "xunfei-avatar-ping");
        thread.setDaemon(true);
        return thread;
    });
    private final Map<String, LiveSession> sessions = new ConcurrentHashMap<>();

    public XunfeiVirtualHumanClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public SessionResult start(AiProviderService.RuntimeProvider provider) throws Exception {
        URI uri = authorizedUri(endpoint(provider.baseUrl()), provider.apiKey(), provider.apiSecret());
        AvatarWebSocketListener listener = new AvatarWebSocketListener();
        WebSocket webSocket = httpClient.newWebSocketBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .buildAsync(uri, listener)
                .get(18, TimeUnit.SECONDS);

        listener.attach(webSocket);
        webSocket.sendText(objectMapper.writeValueAsString(startPayload(provider)), true).join();
        SessionResult result = listener.startFuture.get(25, TimeUnit.SECONDS);
        ScheduledFuture<?> pingTask = scheduler.scheduleAtFixedRate(
                () -> sendPing(provider, webSocket),
                5,
                5,
                TimeUnit.SECONDS
        );
        sessions.put(result.sessionId(), new LiveSession(provider.appId(), provider.serviceId(), webSocket, pingTask));
        return result;
    }

    public JsonNode control(AiProviderService.RuntimeProvider provider, String sessionId, String text) throws Exception {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("虚拟人播报文本不能为空");
        }
        LiveSession session = sessions.get(sessionId);
        if (session == null || session.webSocket().isInputClosed() || session.webSocket().isOutputClosed()) {
            throw new IllegalStateException("讯飞虚拟人会话已失效，请重新进入面试间");
        }
        JsonNode payload = objectMapper.valueToTree(textDriverPayload(provider, text));
        session.webSocket().sendText(objectMapper.writeValueAsString(payload), true).join();
        return payload;
    }

    public void stop(String sessionId) {
        LiveSession session = sessions.remove(sessionId);
        if (session == null) return;
        session.pingTask().cancel(true);
        try {
            session.webSocket().sendText(objectMapper.writeValueAsString(stopPayload(session.appId(), session.sceneId())), true).join();
        } catch (Exception ignored) {
        } finally {
            session.webSocket().sendClose(WebSocket.NORMAL_CLOSURE, "bye");
        }
    }

    @PreDestroy
    public void destroy() {
        sessions.keySet().forEach(this::stop);
        scheduler.shutdownNow();
    }

    private Map<String, Object> startPayload(AiProviderService.RuntimeProvider provider) {
        Map<String, Object> stream = new LinkedHashMap<>();
        stream.put("protocol", "flv");
        stream.put("fps", 25);
        stream.put("bitrate", 2000);

        Map<String, Object> avatar = new LinkedHashMap<>();
        avatar.put("stream", stream);
        avatar.put("avatar_id", normalizedAvatarId(provider.avatarModel()));
        avatar.put("width", WIDTH);
        avatar.put("height", HEIGHT);

        Map<String, Object> tts = new LinkedHashMap<>();
        tts.put("vcn", normalizedVoice(provider.voiceModel()));
        tts.put("speed", 50);
        tts.put("pitch", 50);
        tts.put("volume", 50);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("header", header(provider.appId(), provider.serviceId(), "start"));
        body.put("parameter", Map.of("avatar", avatar, "tts", tts));
        return body;
    }

    private Map<String, Object> textDriverPayload(AiProviderService.RuntimeProvider provider, String text) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("header", header(provider.appId(), provider.serviceId(), "text_driver"));
        body.put("payload", Map.of("text", Map.of("content", text.trim())));
        return body;
    }

    private Map<String, Object> stopPayload(String appId, String sceneId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("header", header(appId, sceneId, "stop"));
        return body;
    }

    private void sendPing(AiProviderService.RuntimeProvider provider, WebSocket webSocket) {
        if (webSocket.isInputClosed() || webSocket.isOutputClosed()) return;
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("header", header(provider.appId(), provider.serviceId(), "ping"));
            webSocket.sendText(objectMapper.writeValueAsString(body), true);
        } catch (Exception ignored) {
        }
    }

    private Map<String, Object> header(String appId, String sceneId, String ctrl) {
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("app_id", appId);
        header.put("request_id", UUID.randomUUID().toString().replace("-", ""));
        header.put("ctrl", ctrl);
        if (sceneId != null && !sceneId.isBlank()) header.put("scene_id", sceneId.trim());
        return header;
    }

    private URI endpoint(String baseUrl) {
        String root = baseUrl == null ? "" : baseUrl.trim();
        if (root.isBlank() || root.contains("待配置")) root = DEFAULT_ENDPOINT;
        if (root.startsWith("http://")) root = "ws://" + root.substring("http://".length());
        if (root.startsWith("https://")) root = "wss://" + root.substring("https://".length());
        root = root.replaceAll("/+$", "");
        if (!root.endsWith("/v1/interact")) root = root + "/v1/interact";
        return URI.create(root);
    }

    private URI authorizedUri(URI uri, String apiKey, String apiSecret) throws Exception {
        String host = uri.getHost();
        String date = DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now(ZoneOffset.UTC));
        String signatureOrigin = "host: " + host + "\n" +
                "date: " + date + "\n" +
                "GET " + uri.getPath() + " HTTP/1.1";
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

    private String responseMessage(JsonNode node) {
        return firstText(node, "message", "desc", "msg").orElse(node.toString());
    }

    private String normalizedAvatarId(String avatarModel) {
        String value = avatarModel == null ? "" : avatarModel.trim();
        if (value.isBlank()) return DEFAULT_AVATAR_ID;
        int separator = value.indexOf(':');
        String normalized = separator >= 0 ? value.substring(separator + 1).trim() : value;
        return normalized.isBlank() ? DEFAULT_AVATAR_ID : normalized;
    }

    private String normalizedVoice(String voiceModel) {
        String value = voiceModel == null ? "" : voiceModel.trim();
        return value.isBlank() || value.contains("不支持") || value.contains("待配置") ? DEFAULT_VOICE_NAME : value;
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

    private final class AvatarWebSocketListener implements WebSocket.Listener {
        private final StringBuilder buffer = new StringBuilder();
        private final CompletableFuture<SessionResult> startFuture = new CompletableFuture<>();
        private WebSocket webSocket;
        private String sessionId = "";

        private void attach(WebSocket webSocket) {
            this.webSocket = webSocket;
        }

        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            buffer.append(data);
            if (!last) return WebSocket.Listener.super.onText(webSocket, data, false);
            String raw = buffer.toString();
            buffer.setLength(0);
            try {
                JsonNode node = objectMapper.readTree(raw);
                int code = responseCode(node);
                if (code != 0) {
                    startFuture.completeExceptionally(new IllegalStateException("讯飞虚拟人接口返回异常："
                            + code + " / " + responseMessage(node)));
                    return WebSocket.Listener.super.onText(webSocket, data, true);
                }
                sessionId = firstText(node, "session").orElse(sessionId);
                JsonNode avatar = node.at("/payload/avatar");
                if (avatar.isObject() && "stream_info".equals(avatar.path("event_type").asText(""))) {
                    String streamUrl = avatar.path("stream_url").asText("");
                    String session = sessionId.isBlank() ? firstText(node, "session").orElse("") : sessionId;
                    if (!session.isBlank()) {
                        startFuture.complete(new SessionResult(session, streamUrl, node.toString()));
                    }
                }
            } catch (Exception exception) {
                startFuture.completeExceptionally(exception);
            }
            return WebSocket.Listener.super.onText(webSocket, data, true);
        }

        @Override
        public void onError(WebSocket webSocket, Throwable error) {
            startFuture.completeExceptionally(error);
            WebSocket.Listener.super.onError(webSocket, error);
        }

        @Override
        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
            if (!startFuture.isDone()) {
                startFuture.completeExceptionally(new IllegalStateException("讯飞虚拟人连接关闭：" + statusCode + " / " + reason));
            }
            if (!sessionId.isBlank()) sessions.remove(sessionId);
            return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
        }
    }

    private record LiveSession(String appId, String sceneId, WebSocket webSocket, ScheduledFuture<?> pingTask) {
    }

    public record SessionResult(String sessionId, String streamUrl, String rawPayload) {
    }
}
