package com.tyut.aiinterview.common;

public record ErrorResponse(int code, String message, String requestId) {
}
