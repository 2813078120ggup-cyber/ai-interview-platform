package com.tyut.aiinterview.media;

import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;

public class LocalObjectStorage {
    public String store(MultipartFile file) throws IOException {
        return file.getOriginalFilename();
    }
}
