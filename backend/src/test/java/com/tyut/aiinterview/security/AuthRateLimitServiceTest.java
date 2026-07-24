package com.tyut.aiinterview.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tyut.aiinterview.common.BusinessException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;

class AuthRateLimitServiceTest {

    @Test
    void rejectsRequestOverConfiguredRedisLimit() {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        when(redisTemplate.execute(ArgumentMatchers.<DefaultRedisScript<Long>>any(), ArgumentMatchers.<List<String>>any(), anyString())).thenReturn(3L);
        AuthRateLimitService service = new AuthRateLimitService(redisTemplate, new AuthRateLimitProperties(2, 60));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.check("login", "127.0.0.1", "candidate_li"));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatus());
    }

    @Test
    void permitsRequestWithinConfiguredRedisLimit() {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        when(redisTemplate.execute(ArgumentMatchers.<DefaultRedisScript<Long>>any(), ArgumentMatchers.<List<String>>any(), anyString())).thenReturn(2L);
        AuthRateLimitService service = new AuthRateLimitService(redisTemplate, new AuthRateLimitProperties(2, 60));

        assertDoesNotThrow(() -> service.check("login", "127.0.0.1", "candidate_li"));
    }
}
