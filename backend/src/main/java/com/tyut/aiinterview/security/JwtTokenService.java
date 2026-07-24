package com.tyut.aiinterview.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class JwtTokenService {
    private final JwtProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtTokenService(JwtProperties properties) {
        this.properties = properties;
    }

    public String createToken(Long userId, String username) {
        try {
            String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
            String payload = encodeJson(Map.of("sub", String.valueOf(userId), "username", username,
                    "iat", Instant.now().getEpochSecond()));
            String signingInput = header + "." + payload;
            return signingInput + "." + sign(signingInput);
        } catch (Exception exception) {
            throw new JwtException("JWT creation failed", exception);
        }
    }

    public Long parseUserId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new JwtException("Malformed JWT");
            }
            String signingInput = parts[0] + "." + parts[1];
            if (!MessageDigestTimingEquals.equals(sign(signingInput), parts[2])) {
                throw new JwtException("Invalid JWT signature");
            }
            Map<?, ?> payload = objectMapper.readValue(Base64.getUrlDecoder().decode(parts[1]), Map.class);
            return Long.valueOf(String.valueOf(payload.get("sub")));
        } catch (JwtException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new JwtException("JWT parse failed", exception);
        }
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private String sign(String signingInput) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        byte[] key = Base64.getDecoder().decode(properties.getJwtSecret());
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
    }

    private static final class MessageDigestTimingEquals {
        static boolean equals(String first, String second) {
            return java.security.MessageDigest.isEqual(first.getBytes(StandardCharsets.UTF_8),
                    second.getBytes(StandardCharsets.UTF_8));
        }
    }
}
