package com.tyut.aiinterview.user.controller;

import com.tyut.aiinterview.user.dto.LoginRequest;
import com.tyut.aiinterview.user.dto.LoginResult;
import com.tyut.aiinterview.user.dto.RegisterRequest;
import com.tyut.aiinterview.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResult> register(@Valid @RequestBody RegisterRequest request) {
        LoginResult result = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResult> login(@Valid @RequestBody LoginRequest request) {
        LoginResult result = userService.login(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResult.UserInfo> me(Principal principal) {
        LoginResult.UserInfo userInfo = userService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(userInfo);
    }
}
