package com.tyut.aiinterview.common;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResult<Void>> handleBusinessException(BusinessException e) {
        log.warn("Business exception: code={}, message={}", e.getCode(), e.getMessage());
        int status = (e.getCode() >= 400 && e.getCode() < 600) ? e.getCode() : 400;
        return ResponseEntity.status(status).body(ApiResult.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResult<Void>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(ApiResult.error(400, message));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResult<Void>> handleAuthentication(AuthenticationException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResult.error(401, e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResult<Void>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResult.error(403, "权限不足"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResult<Void>> handleException(Exception e, HttpServletRequest request) {
        log.error("Unhandled exception at {}: {}", request.getRequestURI(), e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResult.error(500, "服务器内部错误"));
    }
}
