package com.tyut.aiinterview.ai.controller;

import com.tyut.aiinterview.ai.dto.ChatMessage;
import com.tyut.aiinterview.ai.service.AiService;
import com.tyut.aiinterview.common.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/generate-question")
    public ResponseEntity<ApiResponse<String>> generateQuestion(
            @RequestParam String jobType,
            @RequestParam String skillLevel,
            @RequestParam(defaultValue = "3") int count) {
        String result = aiService.generateQuestion(jobType, skillLevel, count);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/follow-up")
    public ResponseEntity<ApiResponse<String>> generateFollowUpQuestion(
            @RequestParam String originalQuestion,
            @RequestParam String candidateAnswer) {
        String result = aiService.generateFollowUpQuestion(originalQuestion, candidateAnswer);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<String>> evaluateAnswer(
            @RequestParam String question,
            @RequestParam String answer,
            @RequestParam(defaultValue = "") String evaluationCriteria) {
        String result = aiService.evaluateAnswer(question, answer, evaluationCriteria);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/interview/start")
    public ResponseEntity<ApiResponse<String>> startInterview(
            @RequestParam String jobType,
            @RequestParam(defaultValue = "") String candidateInfo) {
        String result = aiService.conductInterview(jobType, candidateInfo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/interview/continue")
    public ResponseEntity<ApiResponse<String>> continueInterview(@RequestBody List<ChatMessage> conversation) {
        String result = aiService.continueInterview(conversation);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/multi-modal/analyze")
    public ResponseEntity<ApiResponse<String>> multiModalAnalyze(
            @RequestParam(required = false) String text,
            @RequestParam(required = false) String audioTranscript,
            @RequestParam(required = false) String videoAnalysis) {
        String result = aiService.multiModalAnalyze(text, audioTranscript, videoAnalysis);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
