package com.tyut.aiinterview.interview;

import com.tyut.aiinterview.common.api.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/interviews")
public class InterviewController {
    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @GetMapping
    public ApiResponse<List<InterviewDtos.InterviewView>> list(@RequestParam(required = false) Integer status) {
        return ApiResponse.success(interviewService.list(status));
    }

    @PostMapping
    public ApiResponse<InterviewDtos.InterviewView> create(@Valid @RequestBody InterviewDtos.CreateRequest request) {
        return ApiResponse.success(interviewService.create(request));
    }

    @PostMapping("/{id}/start")
    public ApiResponse<List<InterviewDtos.QuestionInInterviewView>> start(@PathVariable Long id) {
        return ApiResponse.success(interviewService.start(id));
    }

    @PostMapping("/{id}/finish")
    public ApiResponse<Void> finish(@PathVariable Long id) {
        interviewService.finish(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Long id, @RequestBody(required = false) String reason) {
        interviewService.cancel(id, reason);
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}/questions")
    public ApiResponse<List<InterviewDtos.QuestionInInterviewView>> questions(@PathVariable Long id) {
        return ApiResponse.success(interviewService.questions(id));
    }

    @PutMapping("/questions/{interviewQuestionId}/answer")
    public ApiResponse<InterviewDtos.QuestionInInterviewView> answer(@PathVariable Long interviewQuestionId,
                                                                     @RequestBody InterviewDtos.AnswerRequest request) {
        return ApiResponse.success(interviewService.answer(interviewQuestionId, request));
    }

    @GetMapping("/practice-banks")
    public ApiResponse<List<InterviewDtos.PracticeBankView>> practiceBanks() {
        return ApiResponse.success(interviewService.practiceBanks());
    }
}
