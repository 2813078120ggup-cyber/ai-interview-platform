package com.tyut.aiinterview.media;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.config.StorageProperties;
import com.tyut.aiinterview.domain.MediaFile;
import com.tyut.aiinterview.mapper.MediaFileMapper;
import com.tyut.aiinterview.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class MediaServiceAccessTest {

    @Test
    void rejectsAnotherCandidateReadingMediaById() {
        MediaFileMapper mapper = mock(MediaFileMapper.class);
        CurrentUser currentUser = mock(CurrentUser.class);
        when(mapper.selectById(100L)).thenReturn(mediaOwnedBy(1L));
        when(currentUser.id()).thenReturn(2L);
        when(currentUser.hasRole("ADMIN")).thenReturn(false);

        MediaService service = service(mapper, currentUser);

        BusinessException exception = assertThrows(BusinessException.class, () -> service.get(100L));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void permitsMediaOwnerReadingOwnMedia() {
        MediaFileMapper mapper = mock(MediaFileMapper.class);
        CurrentUser currentUser = mock(CurrentUser.class);
        when(mapper.selectById(100L)).thenReturn(mediaOwnedBy(1L));
        when(currentUser.id()).thenReturn(1L);

        MediaDtos.MediaVO media = service(mapper, currentUser).get(100L);

        assertEquals(100L, media.id());
    }

    @Test
    void permitsAdministratorReadingCandidateMedia() {
        MediaFileMapper mapper = mock(MediaFileMapper.class);
        CurrentUser currentUser = mock(CurrentUser.class);
        when(mapper.selectById(100L)).thenReturn(mediaOwnedBy(1L));
        when(currentUser.id()).thenReturn(2L);
        when(currentUser.hasRole("ADMIN")).thenReturn(true);

        MediaDtos.MediaVO media = service(mapper, currentUser).get(100L);

        assertEquals(100L, media.id());
    }

    private MediaService service(MediaFileMapper mapper, CurrentUser currentUser) {
        return new MediaService(mapper, mock(LocalObjectStorage.class), new StorageProperties("./target/test-media", 1024L), currentUser);
    }

    private MediaFile mediaOwnedBy(Long ownerId) {
        MediaFile media = new MediaFile();
        media.setId(100L);
        media.setOwnerId(ownerId);
        media.setOriginalName("answer.webm");
        media.setContentType("audio/webm");
        media.setMediaType("audio");
        media.setSizeBytes(1024L);
        media.setStatus(MediaFile.AVAILABLE);
        return media;
    }
}
