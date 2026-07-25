package com.tyut.aiinterview.virtualhuman;

public final class VirtualHumanDtos {
    private VirtualHumanDtos() {
    }

    /**
     * Browser-safe configuration for the official iFlytek Web SDK. The API
     * secret never leaves the server; signedUrl is short lived.
     */
    public record SdkConfigResponse(
            boolean enabled,
            String provider,
            String status,
            String message,
            String signedUrl,
            String appId,
            String sceneId,
            String avatarId,
            String vcn,
            String protocol
    ) {
    }
}
