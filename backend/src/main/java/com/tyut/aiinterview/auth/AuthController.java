package com.tyut.aiinterview.auth;

import com.tyut.aiinterview.common.ApiResponse;
import com.tyut.aiinterview.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final CurrentUser currentUser;
    public AuthController(AuthService authService, CurrentUser currentUser) { this.authService = authService; this.currentUser = currentUser; }

    @PostMapping("/register")
    public ApiResponse<AuthDtos.UserProfile> register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }
    @PostMapping("/login")
    public ApiResponse<AuthDtos.LoginResponse> login(@Valid @RequestBody AuthDtos.LoginRequest request, HttpServletRequest servletRequest) {
        return ApiResponse.ok(authService.login(request, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent")));
    }
    @PostMapping("/refresh")
    public ApiResponse<AuthDtos.LoginResponse> refresh(@Valid @RequestBody AuthDtos.RefreshRequest request, HttpServletRequest servletRequest) {
        return ApiResponse.ok(authService.refresh(request, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent")));
    }
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody AuthDtos.LogoutRequest request) {
        authService.logout(request, currentUser.id());
        return ApiResponse.ok();
    }
    @GetMapping("/me")
    public ApiResponse<AuthDtos.UserProfile> me() {
        return ApiResponse.ok(authService.profileOf(currentUser.id()));
    }
}
