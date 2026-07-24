package com.tyut.aiinterview.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

class JwtTokenServiceTest {

    private static final String TEST_SECRET = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    @Test
    void createsAndParsesTokenWithBase64Secret() {
        JwtProperties properties = new JwtProperties();
        properties.setJwtSecret(TEST_SECRET);
        JwtTokenService service = new JwtTokenService(properties);

        String token = service.createToken(42L, "candidate_zhang");

        assertEquals(42L, service.parseUserId(token));
    }

    @Test
    void rejectsTokenSignedWithAnotherSecret() {
        JwtProperties firstProperties = new JwtProperties();
        firstProperties.setJwtSecret(TEST_SECRET);
        JwtTokenService firstService = new JwtTokenService(firstProperties);

        JwtProperties secondProperties = new JwtProperties();
        secondProperties.setJwtSecret("AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=");
        JwtTokenService secondService = new JwtTokenService(secondProperties);

        assertThrows(JwtException.class, () -> secondService.parseUserId(firstService.createToken(42L, "candidate_zhang")));
    }
}
