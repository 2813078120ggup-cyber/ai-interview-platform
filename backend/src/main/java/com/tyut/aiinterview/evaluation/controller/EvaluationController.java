package com.tyut.aiinterview.evaluation.controller;

import com.tyut.aiinterview.common.ApiResult;
import com.tyut.aiinterview.evaluation.dto.EvaluationRequest;
import com.tyut.aiinterview.evaluation.dto.EvaluationVO;
import com.tyut.aiinterview.evaluation.service.EvaluationService;
import com.tyut.aiinterview.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationService evaluationService;
    private final UserService userService;

    public EvaluationController(EvaluationService evaluationService, UserService userService) {
        this.evaluationService = evaluationService;
        this.userService = userService;
    }

    @PostMapping("/human/{interviewQuestionId}")
    public ApiResult<EvaluationVO> submitHumanEvaluation(@PathVariable Long interviewQuestionId,
                                                          @Valid @RequestBody EvaluationRequest request,
                                                          Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(evaluationService.submitHumanEvaluation(interviewQuestionId, request, userId));
    }

    @PostMapping("/ai/{interviewQuestionId}")
    public ApiResult<EvaluationVO> submitAiEvaluation(@PathVariable Long interviewQuestionId,
                                                       @Valid @RequestBody EvaluationRequest request) {
        return ApiResult.success(evaluationService.submitAiEvaluation(interviewQuestionId, request));
    }

    @GetMapping("/interview/{interviewId}")
    public ApiResult<List<EvaluationVO>> listEvaluations(@PathVariable Long interviewId) {
        return ApiResult.success(evaluationService.listEvaluations(interviewId));
    }

    @PutMapping("/{evaluationId}/confirm")
    public ApiResult<Void> confirmEvaluation(@PathVariable Long evaluationId, Principal principal) {
        Long userId = getUserId(principal);
        evaluationService.confirmEvaluation(evaluationId, userId);
        return ApiResult.success();
    }

    private Long getUserId(Principal principal) {
        return userService.getCurrentUser(principal.getName()).getId();
    }
}
