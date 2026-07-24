package com.gc.aiinterview.common.api;

/** Standard response envelope shared by all HTTP APIs. */
public record ApiResponse<T>(int code, String message, T data) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "OK", data);
    }
}
