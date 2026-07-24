package com.tyut.aiinterview.interview.controller;

import com.tyut.aiinterview.common.ApiResult;
import com.tyut.aiinterview.interview.dto.SubmitAnswerRequest;
import com.tyut.aiinterview.interview.entity.InterviewAnswer;
import com.tyut.aiinterview.interview.entity.InterviewQuestion;
import com.tyut.aiinterview.interview.service.InterviewService;
import com.tyut.aiinterview.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/interview-room")
public class InterviewRoomController {

    private final InterviewService interviewService;
    private final UserService userService;

    public InterviewRoomController(InterviewService interviewService, UserService userService) {
        this.interviewService = interviewService;
        this.userService = userService;
    }

    @PutMapping("/{interviewId}/start")
    public ApiResult<List<InterviewQuestion>> startInterview(@PathVariable Long interviewId,
                                                              Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(interviewService.startInterview(interviewId, userId));
    }

    @PutMapping("/{interviewId}/end")
    public ApiResult<Void> endInterview(@PathVariable Long interviewId, Principal principal) {
        Long userId = getUserId(principal);
        interviewService.endInterview(interviewId, userId);
        return ApiResult.success();
    }

    @PostMapping("/questions/{interviewQuestionId}/answer")
    public ApiResult<InterviewAnswer> submitAnswer(@PathVariable Long interviewQuestionId,
                                                    @Valid @RequestBody SubmitAnswerRequest request,
                                                    Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(interviewService.submitAnswer(interviewQuestionId, request, userId));
    }

    @GetMapping("/{interviewId}/questions")
    public ApiResult<List<InterviewQuestion>> getQuestions(@PathVariable Long interviewId, Principal principal) {
        var userInfo = userService.getCurrentUser(principal.getName());
        boolean isCandidate = userInfo.getRoles().contains("CANDIDATE");
        // Candidate view: hide correct answers (US-03, role conflict)
        return ApiResult.success(interviewService.getInterviewQuestions(interviewId, !isCandidate));
    }

    @GetMapping("/{interviewId}/answers")
    public ApiResult<List<InterviewAnswer>> getAnswers(@PathVariable Long interviewId) {
        return ApiResult.success(interviewService.getInterviewAnswers(interviewId));
    }

    private Long getUserId(Principal principal) {
        return userService.getCurrentUser(principal.getName()).getId();
    }
}
