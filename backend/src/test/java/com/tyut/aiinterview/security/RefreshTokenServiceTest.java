package com.tyut.aiinterview.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.domain.RefreshToken;
import com.tyut.aiinterview.mapper.RefreshTokenMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;

class RefreshTokenServiceTest {

    @Test
    void rejectsSecondConcurrentRotationWhenConditionalUpdateLosesRace() {
        RefreshTokenMapper mapper = mock(RefreshTokenMapper.class);
        RefreshToken token = activeToken();
        when(mapper.selectOne(ArgumentMatchers.<LambdaQueryWrapper<RefreshToken>>any())).thenReturn(token);
        when(mapper.update(ArgumentMatchers.<RefreshToken>isNull(), ArgumentMatchers.<LambdaUpdateWrapper<RefreshToken>>any())).thenReturn(0);
        RefreshTokenService service = new RefreshTokenService(mapper, new JwtProperties());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.rotate("refresh-token", "127.0.0.1", "JUnit"));

        assertEquals(40300, exception.getCode());
        verify(mapper, never()).insert(ArgumentMatchers.any(RefreshToken.class));
    }

    @Test
    void rejectsExpiredTokenBeforeAttemptingRotation() {
        RefreshTokenMapper mapper = mock(RefreshTokenMapper.class);
        RefreshToken token = activeToken();
        token.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        when(mapper.selectOne(ArgumentMatchers.<LambdaQueryWrapper<RefreshToken>>any())).thenReturn(token);
        RefreshTokenService service = new RefreshTokenService(mapper, new JwtProperties());

        assertThrows(BusinessException.class, () -> service.rotate("refresh-token", "127.0.0.1", "JUnit"));
        verify(mapper, never()).update(ArgumentMatchers.<RefreshToken>isNull(), ArgumentMatchers.<LambdaUpdateWrapper<RefreshToken>>any());
    }

    private RefreshToken activeToken() {
        RefreshToken token = new RefreshToken();
        token.setId(8L);
        token.setUserId(3L);
        token.setTokenHash("hash");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        return token;
    }
}
