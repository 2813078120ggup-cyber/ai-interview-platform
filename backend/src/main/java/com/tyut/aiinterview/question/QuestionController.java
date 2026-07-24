package com.tyut.aiinterview.question;

import com.tyut.aiinterview.common.api.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/questions")
public class QuestionController {
    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping("/banks")
    public ApiResponse<List<QuestionDtos.BankView>> banks() {
        return ApiResponse.success(questionService.banks());
    }

    @PostMapping("/banks")
    public ApiResponse<QuestionDtos.BankView> createBank(@Valid @RequestBody QuestionDtos.BankRequest request) {
        return ApiResponse.success(questionService.createBank(request));
    }

    @GetMapping
    public ApiResponse<List<QuestionDtos.QuestionView>> questions(@RequestParam(required = false) Long bankId,
                                                                  @RequestParam(required = false) String keyword) {
        return ApiResponse.success(questionService.questions(bankId, keyword));
    }

    @PostMapping
    public ApiResponse<QuestionDtos.QuestionView> createQuestion(@Valid @RequestBody QuestionDtos.QuestionRequest request) {
        return ApiResponse.success(questionService.createQuestion(request));
    }

    @PostMapping("/generate")
    public ApiResponse<List<QuestionDtos.QuestionView>> generate(@Valid @RequestBody QuestionDtos.GenerateRequest request) {
        return ApiResponse.success(questionService.generate(request));
    }
}
