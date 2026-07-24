package com.tyut.aiinterview.question.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.common.ApiResult;
import com.tyut.aiinterview.question.dto.QuestionBankRequest;
import com.tyut.aiinterview.question.dto.QuestionRequest;
import com.tyut.aiinterview.question.dto.QuestionVO;
import com.tyut.aiinterview.question.entity.QuestionBank;
import com.tyut.aiinterview.question.service.QuestionService;
import com.tyut.aiinterview.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;
    private final UserService userService;

    public QuestionController(QuestionService questionService, UserService userService) {
        this.questionService = questionService;
        this.userService = userService;
    }

    // ===== Question Banks =====

    @PostMapping("/banks")
    public ApiResult<QuestionBank> createBank(@Valid @RequestBody QuestionBankRequest request, Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(questionService.createBank(request, userId));
    }

    @PutMapping("/banks/{id}")
    public ApiResult<QuestionBank> updateBank(@PathVariable Long id,
                                               @Valid @RequestBody QuestionBankRequest request) {
        return ApiResult.success(questionService.updateBank(id, request));
    }

    @GetMapping("/banks")
    public ApiResult<List<QuestionBank>> listBanks() {
        return ApiResult.success(questionService.listBanks());
    }

    @DeleteMapping("/banks/{id}")
    public ApiResult<Void> deleteBank(@PathVariable Long id) {
        questionService.deleteBank(id);
        return ApiResult.success();
    }

    // ===== Questions =====

    @PostMapping
    public ApiResult<QuestionVO> createQuestion(@Valid @RequestBody QuestionRequest request, Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(questionService.createQuestion(request, userId));
    }

    @PutMapping("/{id}")
    public ApiResult<QuestionVO> updateQuestion(@PathVariable Long id,
                                                 @Valid @RequestBody QuestionRequest request) {
        return ApiResult.success(questionService.updateQuestion(id, request));
    }

    @GetMapping
    public ApiResult<Page<QuestionVO>> listQuestions(
            @RequestParam(required = false) Long bankId,
            @RequestParam(required = false) String questionType,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return ApiResult.success(questionService.listQuestions(bankId, questionType, difficulty, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResult<QuestionVO> getQuestion(@PathVariable Long id) {
        return ApiResult.success(questionService.getQuestionById(id));
    }

    @PutMapping("/{id}/status")
    public ApiResult<Void> updateQuestionStatus(@PathVariable Long id, @RequestParam Integer status) {
        questionService.updateQuestionStatus(id, status);
        return ApiResult.success();
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ApiResult.success();
    }

    private Long getUserId(Principal principal) {
        var userInfo = userService.getCurrentUser(principal.getName());
        return userInfo.getId();
    }
}
