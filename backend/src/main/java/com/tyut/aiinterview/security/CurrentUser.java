package com.tyut.aiinterview.security;

import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    public Long id() {
        return 1L;
    }

    public boolean hasRole(String roleCode) {
        return "ADMIN".equals(roleCode);
    }
}
