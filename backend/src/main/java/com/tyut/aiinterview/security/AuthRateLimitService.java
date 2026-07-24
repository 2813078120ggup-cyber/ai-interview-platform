package com.tyut.aiinterview.security;

import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.utils.TokenHashUtils;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

/** Protects public authentication endpoints from credential stuffing and token guessing. */
@Service
public class AuthRateLimitService {
    private static final Logger log = LoggerFactory.getLogger(AuthRateLimitService.class);
    private static final String KEY_PREFIX = "ai-interview:auth-rate-limit:";
    private static final DefaultRedisScript<Long> INCREMENT_WINDOW = new DefaultRedisScript<>(
            "local count = redis.call('INCR', KEYS[1]); "
                    + "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; "
                    + "return count;",
            Long.class);

    private final StringRedisTemplate redisTemplate;
    private final AuthRateLimitProperties properties;
    private final ConcurrentMap<String, LocalWindow> localWindows = new ConcurrentHashMap<>();
    private final AtomicBoolean redisFallbackLogged = new AtomicBoolean();

    public AuthRateLimitService(StringRedisTemplate redisTemplate, AuthRateLimitProperties properties) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
    }

    public void check(String action, String clientIp, String identity) {
        String key = key(action, clientIp, identity);
        long attempts = increment(key);
        if (attempts > properties.maxAttempts()) {
            throw BusinessException.tooManyRequests("操作过于频繁，请稍后再试");
        }
    }

    public void reset(String action, String clientIp, String identity) {
        String key = key(action, clientIp, identity);
        localWindows.remove(key);
        try {
            redisTemplate.delete(key);
        } catch (DataAccessException exception) {
            log.debug("Redis unavailable while clearing authentication rate-limit key");
        }
    }

    private long increment(String key) {
        try {
            Long attempts = redisTemplate.execute(INCREMENT_WINDOW, List.of(key), String.valueOf(properties.windowSeconds()));
            if (attempts != null) {
                redisFallbackLogged.set(false);
                return attempts;
            }
        } catch (DataAccessException exception) {
            if (redisFallbackLogged.compareAndSet(false, true)) {
                log.warn("Redis unavailable; using local authentication rate-limit fallback");
            }
        }
        return incrementLocal(key);
    }

    private long incrementLocal(String key) {
        long now = Instant.now().toEpochMilli();
        long expiresAt = now + properties.windowSeconds() * 1000L;
        LocalWindow window = localWindows.compute(key, (ignored, current) -> {
            if (current == null || current.expiresAtEpochMs() <= now) {
                return new LocalWindow(1L, expiresAt);
            }
            return new LocalWindow(current.attempts() + 1L, current.expiresAtEpochMs());
        });
        return window.attempts();
    }

    private String key(String action, String clientIp, String identity) {
        String scope = identity == null ? "" : identity.trim();
        String source = (clientIp == null ? "unknown" : clientIp) + '|' + scope;
        return KEY_PREFIX + action + ':' + TokenHashUtils.sha256(source);
    }

    private record LocalWindow(long attempts, long expiresAtEpochMs) {
    }
}
