package com.tyut.aiinterview.common;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {
    private final int code;
    private final HttpStatus status;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
        this.status = resolveStatus(code);
    }

    public BusinessException(String message) {
        this(HttpStatus.BAD_REQUEST.value(), message);
    }

    public BusinessException(HttpStatus status, String message) {
        this(status, status.value(), message);
    }

    public BusinessException(HttpStatus status, int code, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public int getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static BusinessException tooManyRequests(String message) {
        return new BusinessException(HttpStatus.TOO_MANY_REQUESTS, 429, message);
    }

    public static BusinessException forbidden(String message) {
        return new BusinessException(HttpStatus.FORBIDDEN, 403, message);
    }

    private static HttpStatus resolveStatus(int code) {
        HttpStatus status = HttpStatus.resolve(code);
        return status == null ? HttpStatus.BAD_REQUEST : status;
    }
}
