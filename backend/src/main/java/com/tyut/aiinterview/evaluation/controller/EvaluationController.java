package com.tyut.aiinterview.evaluation.controller;

import com.tyut.aiinterview.common.api.ApiResponse;
import com.tyut.aiinterview.evaluation.dto.EvaluationRequest;
import com.tyut.aiinterview.evaluation.dto.EvaluationResponse;
import com.tyut.aiinterview.evaluation.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<ApiResponse<EvaluationResponse>> createEvaluation(@RequestBody EvaluationRequest request) {
        EvaluationResponse response = evaluationService.createEvaluation(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvaluationResponse>> getEvaluation(@PathVariable Long id) {
        EvaluationResponse response = evaluationService.getEvaluationById(id);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.error("Evaluation not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/interview-question/{interviewQuestionId}")
    public ResponseEntity<ApiResponse<List<EvaluationResponse>>> getEvaluationsByInterviewQuestion(
            @PathVariable Long interviewQuestionId) {
        List<EvaluationResponse> responses = evaluationService.getEvaluationsByInterviewQuestionId(interviewQuestionId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<ApiResponse<List<EvaluationResponse>>> getEvaluationsByInterview(
            @PathVariable Long interviewId) {
        List<EvaluationResponse> responses = evaluationService.getEvaluationsByInterviewId(interviewId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EvaluationResponse>> updateEvaluation(
            @PathVariable Long id, @RequestBody EvaluationRequest request) {
        EvaluationResponse response = evaluationService.updateEvaluation(id, request);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.error("Evaluation not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<EvaluationResponse>> confirmEvaluation(
            @PathVariable Long id, @RequestParam Long confirmedBy) {
        EvaluationResponse response = evaluationService.confirmEvaluation(id, confirmedBy);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.error("Evaluation not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(@PathVariable Long id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/ai")
    public ResponseEntity<ApiResponse<EvaluationResponse>> createAiEvaluation(
            @RequestParam Long interviewQuestionId,
            @RequestParam String question,
            @RequestParam String answer) {
        EvaluationResponse response = evaluationService.createAiEvaluation(interviewQuestionId, question, answer);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
