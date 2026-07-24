package com.tyut.aiinterview.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void keepsUnexpectedExceptionDetailsOutOfClientResponse() {
        MDC.put("requestId", "request-123");
        try {
            var response = handler.handleUnexpected(new IllegalStateException("database password must not leak"));

            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertEquals(50000, response.getBody().code());
            assertEquals("系统繁忙，请稍后重试", response.getBody().message());
            assertEquals("request-123", response.getBody().requestId());
            assertFalse(response.getBody().message().contains("password"));
        } finally {
            MDC.remove("requestId");
        }
    }

    @Test
    void mapsMalformedJsonToBadRequest() {
        var response = handler.handleUnreadableRequest(
                new HttpMessageNotReadableException("invalid json", new MockHttpInputMessage(new byte[0])));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(40002, response.getBody().code());
    }
}
