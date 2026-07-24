package com.tyut.aiinterview.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.domain.RefreshToken;
import com.tyut.aiinterview.mapper.RefreshTokenMapper;
import com.tyut.aiinterview.utils.TokenHashUtils;
import java.time.LocalDateTime;
import java.util.UUID;

public class RefreshTokenService {
    private final RefreshTokenMapper mapper;
    private final JwtProperties properties;

    public RefreshTokenService(RefreshTokenMapper mapper, JwtProperties properties) {
        this.mapper = mapper;
        this.properties = properties;
    }

    public String rotate(String refreshToken, String clientIp, String userAgent) {
        String tokenHash = TokenHashUtils.sha256(refreshToken);
        RefreshToken existing = mapper.selectOne(new LambdaQueryWrapper<RefreshToken>()
                .eq(RefreshToken::getTokenHash, tokenHash)
                .isNull(RefreshToken::getRevokedAt));
        if (existing == null || existing.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw BusinessException.forbidden("刷新令牌无效或已过期");
        }
        String nextToken = UUID.randomUUID().toString();
        String nextHash = TokenHashUtils.sha256(nextToken);
        int updated = mapper.update(null, new UpdateWrapper<RefreshToken>()
                .eq("id", existing.getId())
                .isNull("revoked_at")
                .set("revoked_at", LocalDateTime.now())
                .set("replaced_by_token_hash", nextHash));
        if (updated != 1) {
            throw BusinessException.forbidden("刷新令牌已被使用");
        }
        RefreshToken next = new RefreshToken();
        next.setUserId(existing.getUserId());
        next.setTokenHash(nextHash);
        next.setClientIp(clientIp);
        next.setUserAgent(userAgent);
        next.setExpiresAt(LocalDateTime.now().plusDays(properties.getRefreshTokenDays()));
        mapper.insert(next);
        return nextToken;
    }
}
