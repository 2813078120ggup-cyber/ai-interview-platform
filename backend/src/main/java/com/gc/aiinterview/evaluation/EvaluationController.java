package com.gc.aiinterview.evaluation;

import com.gc.aiinterview.common.ApiResponse;
import com.gc.aiinterview.domain.Evaluation;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/interviews/{interviewId}/evaluations")
public class EvaluationController {
    private final EvaluationService service;
    public EvaluationController(EvaluationService service) { this.service = service; }
    @GetMapping public ApiResponse<List<Evaluation>> list(@PathVariable Long interviewId) { return ApiResponse.ok(service.list(interviewId)); }
    @PutMapping("/{interviewQuestionId}") public ApiResponse<Evaluation> submit(@PathVariable Long interviewId, @PathVariable Long interviewQuestionId, @Valid @RequestBody EvaluationDtos.HumanEvaluationRequest request) { return ApiResponse.ok(service.submitHuman(interviewId, interviewQuestionId, request)); }
}
