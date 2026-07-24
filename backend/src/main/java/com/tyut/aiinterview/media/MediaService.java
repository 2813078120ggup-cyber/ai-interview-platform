package com.tyut.aiinterview.media;

import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.config.StorageProperties;
import com.tyut.aiinterview.domain.MediaFile;
import com.tyut.aiinterview.mapper.MediaFileMapper;
import com.tyut.aiinterview.security.CurrentUser;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

public class MediaService {
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "mp3", "audio/mpeg",
            "webm", "audio/webm",
            "wav", "audio/wav",
            "mp4", "video/mp4",
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg");

    private final MediaFileMapper mapper;
    private final LocalObjectStorage storage;
    private final StorageProperties properties;
    private final CurrentUser currentUser;

    public MediaService(MediaFileMapper mapper, LocalObjectStorage storage, StorageProperties properties, CurrentUser currentUser) {
        this.mapper = mapper;
        this.storage = storage;
        this.properties = properties;
        this.currentUser = currentUser;
    }

    public MediaDtos.MediaVO upload(MultipartFile file) {
        validate(file);
        return new MediaDtos.MediaVO(null, file.getOriginalFilename(), file.getContentType(), mediaType(file.getContentType()), file.getSize());
    }

    public MediaDtos.MediaVO get(Long id) {
        MediaFile media = mapper.selectById(id);
        if (media == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "媒体文件不存在");
        }
        if (!currentUser.hasRole("ADMIN") && !currentUser.id().equals(media.getOwnerId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "无权限访问该媒体文件");
        }
        return new MediaDtos.MediaVO(media.getId(), media.getOriginalName(), media.getContentType(), media.getMediaType(), media.getSizeBytes());
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件不能为空");
        }
        if (file.getSize() > properties.maxSizeBytes()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件过大");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String extension = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1) : "";
        String expectedContentType = ALLOWED_TYPES.get(extension);
        if (expectedContentType == null || !expectedContentType.equals(file.getContentType())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "文件类型不允许");
        }
    }

    private String mediaType(String contentType) {
        if (contentType == null) {
            return "unknown";
        }
        return contentType.startsWith("audio/") ? "audio" : contentType.startsWith("video/") ? "video" : "image";
    }
}
