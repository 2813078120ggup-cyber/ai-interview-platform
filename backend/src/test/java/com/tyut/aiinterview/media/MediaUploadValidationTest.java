package com.tyut.aiinterview.media;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.config.StorageProperties;
import com.tyut.aiinterview.mapper.MediaFileMapper;
import com.tyut.aiinterview.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

class MediaUploadValidationTest {

    @Test
    void rejectsSvgUploadToPreventScriptBearingImageContent() {
        MultipartFile file = file("payload.svg", "image/svg+xml");

        BusinessException exception = assertThrows(BusinessException.class, () -> service().upload(file));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void rejectsContentTypeThatDoesNotMatchFileExtension() {
        MultipartFile file = file("answer.mp3", "text/html");

        BusinessException exception = assertThrows(BusinessException.class, () -> service().upload(file));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    private MultipartFile file(String name, String contentType) {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1L);
        when(file.getOriginalFilename()).thenReturn(name);
        when(file.getContentType()).thenReturn(contentType);
        return file;
    }

    private MediaService service() {
        return new MediaService(mock(MediaFileMapper.class), mock(LocalObjectStorage.class),
                new StorageProperties("./target/test-media", 1024L), mock(CurrentUser.class));
    }
}
