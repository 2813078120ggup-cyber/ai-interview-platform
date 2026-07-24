package com.tyut.aiinterview.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestIdFilterTest {

    @Test
    void replacesUnsafeCallerSuppliedRequestIdAndCleansMdc() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdFilter.HEADER_NAME, "invalid request id");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> requestIdSeenInChain = new AtomicReference<>();

        new RequestIdFilter().doFilter(request, response,
                (servletRequest, servletResponse) -> requestIdSeenInChain.set(MDC.get("requestId")));

        assertTrue(requestIdSeenInChain.get().matches("[A-Za-z0-9._-]{1,64}"));
        assertEquals(requestIdSeenInChain.get(), response.getHeader(RequestIdFilter.HEADER_NAME));
        assertNull(MDC.get("requestId"));
    }
}
