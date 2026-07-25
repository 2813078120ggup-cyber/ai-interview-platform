package com.tyut.aiinterview.virtualhuman;

import com.tyut.aiinterview.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/virtual-human")
public class VirtualHumanController {
    private final VirtualHumanService service;

    public VirtualHumanController(VirtualHumanService service) {
        this.service = service;
    }

    @PostMapping("/speak")
    public ApiResponse<VirtualHumanDtos.SpeakResponse> speak(@Valid @RequestBody VirtualHumanDtos.SpeakRequest request) {
        return ApiResponse.ok(service.speak(request));
    }
}
