package com.gc.aiinterview.media;

import com.gc.aiinterview.common.BusinessException;
import com.gc.aiinterview.config.StorageProperties;
import com.gc.aiinterview.domain.MediaFile;
import com.gc.aiinterview.mapper.MediaFileMapper;
import com.gc.aiinterview.security.CurrentUser;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaService {
    private final MediaFileMapper mediaMapper;
    private final LocalObjectStorage storage;
    private final StorageProperties properties;
    private final CurrentUser currentUser;

    public MediaService(MediaFileMapper mediaMapper, LocalObjectStorage storage, StorageProperties properties, CurrentUser currentUser) {
        this.mediaMapper = mediaMapper; this.storage = storage; this.properties = properties; this.currentUser = currentUser;
    }

    @Transactional
    public MediaDtos.MediaVO upload(MultipartFile file) {
        if (file == null || file.isEmpty()) throw BusinessException.badRequest("上传文件不能为空");
        if (file.getSize() > properties.maxUploadBytes()) throw BusinessException.badRequest("上传文件超过大小限制");
        String mediaType = mediaType(file.getContentType());
        String extension = extension(file.getOriginalFilename());
        try (InputStream input = file.getInputStream()) {
            String key = storage.save(extension, input);
            MediaFile media = new MediaFile(); media.setOwnerId(currentUser.id()); media.setBucketName("local"); media.setObjectKey(key);
            media.setOriginalName(file.getOriginalFilename()); media.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            media.setMediaType(mediaType); media.setSizeBytes(file.getSize()); media.setChecksumSha256(sha256(storage.path(key))); media.setStatus(MediaFile.AVAILABLE);
            mediaMapper.insert(media); return toVO(media);
        } catch (IOException exception) { throw new IllegalStateException("保存上传文件失败", exception); }
    }

    public MediaDtos.MediaVO get(Long id) { return toVO(requireReadable(id)); }
    public Resource content(Long id) { return storage.resource(requireReadable(id).getObjectKey()); }
    public MediaFile requireOwned(Long id) { MediaFile media = requireReadable(id); if (!currentUser.id().equals(media.getOwnerId())) throw BusinessException.forbidden("无权使用该媒体文件"); return media; }

    private MediaFile requireReadable(Long id) { MediaFile media = mediaMapper.selectById(id); if (media == null || media.getStatus() != MediaFile.AVAILABLE) throw BusinessException.notFound("媒体文件不存在或不可用"); return media; }
    private String mediaType(String contentType) { if (contentType == null) throw BusinessException.badRequest("无法识别媒体类型"); if (contentType.startsWith("audio/")) return "audio"; if (contentType.startsWith("video/")) return "video"; if (contentType.startsWith("image/")) return "image"; if ("application/pdf".equals(contentType)) return "pdf"; throw BusinessException.badRequest("不支持的媒体类型"); }
    private String extension(String name) { if (name == null) return ""; int index = name.lastIndexOf('.'); return index < 0 ? "" : name.substring(index + 1).replaceAll("[^A-Za-z0-9]", ""); }
    private String sha256(java.nio.file.Path path) { try { byte[] digest = MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(path)); StringBuilder result = new StringBuilder(); for (byte item : digest) result.append(String.format("%02x", item)); return result.toString(); } catch (IOException | NoSuchAlgorithmException exception) { throw new IllegalStateException("计算媒体摘要失败", exception); } }
    private MediaDtos.MediaVO toVO(MediaFile media) { return new MediaDtos.MediaVO(media.getId(), media.getOriginalName(), media.getContentType(), media.getMediaType(), media.getSizeBytes(), media.getStatus(), media.getCreatedAt()); }
}
