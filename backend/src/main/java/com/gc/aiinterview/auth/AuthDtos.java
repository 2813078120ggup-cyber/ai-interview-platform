package com.gc.aiinterview.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 64) String username,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 64) String realName,
            String email, String phone) {}

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record LogoutRequest(@NotBlank String refreshToken) {}

    public record LoginResponse(String token, String refreshToken, UserProfile user) {}

    public record UserProfile(Long id, String username, String realName, List<String> roles) {}
}
