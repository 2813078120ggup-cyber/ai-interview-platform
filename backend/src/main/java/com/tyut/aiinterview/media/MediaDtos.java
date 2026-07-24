package com.tyut.aiinterview.media;

public final class MediaDtos {
    private MediaDtos() {
    }

    public record MediaVO(Long id, String originalName, String contentType, String mediaType, Long sizeBytes) {
    }
}
