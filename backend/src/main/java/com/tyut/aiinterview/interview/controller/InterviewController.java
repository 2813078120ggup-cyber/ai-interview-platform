package com.tyut.aiinterview.interview.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.common.ApiResult;
import com.tyut.aiinterview.interview.dto.CreateInterviewRequest;
import com.tyut.aiinterview.interview.dto.InterviewVO;
import com.tyut.aiinterview.interview.dto.UpdateInterviewRequest;
import com.tyut.aiinterview.interview.service.InterviewService;
import com.tyut.aiinterview.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;
    private final UserService userService;

    public InterviewController(InterviewService interviewService, UserService userService) {
        this.interviewService = interviewService;
        this.userService = userService;
    }

    @PostMapping
    public ApiResult<InterviewVO> createInterview(@Valid @RequestBody CreateInterviewRequest request,
                                                   Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(interviewService.createInterview(request, userId));
    }

    @PutMapping("/{id}")
    public ApiResult<InterviewVO> updateInterview(@PathVariable Long id,
                                                   @Valid @RequestBody UpdateInterviewRequest request) {
        return ApiResult.success(interviewService.updateInterview(id, request));
    }

    @PutMapping("/{id}/cancel")
    public ApiResult<Void> cancelInterview(@PathVariable Long id,
                                            @RequestBody Map<String, String> body,
                                            Principal principal) {
        Long userId = getUserId(principal);
        interviewService.cancelInterview(id, body.get("reason"), userId);
        return ApiResult.success();
    }

    @PutMapping("/{id}/absent")
    public ApiResult<Void> markAbsent(@PathVariable Long id, Principal principal) {
        Long userId = getUserId(principal);
        interviewService.markCandidateAbsent(id, userId);
        return ApiResult.success();
    }

    @GetMapping
    public ApiResult<Page<InterviewVO>> listInterviews(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            Principal principal) {
        var userInfo = userService.getCurrentUser(principal.getName());
        String role = userInfo.getRoles().stream()
                .filter(r -> List.of("HR", "ADMIN", "INTERVIEWER", "CANDIDATE").contains(r))
                .findFirst().orElse("CANDIDATE");
        return ApiResult.success(interviewService.listInterviews(userInfo.getId(), role, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResult<InterviewVO> getInterview(@PathVariable Long id) {
        return ApiResult.success(interviewService.getInterviewDetail(id));
    }

    private Long getUserId(Principal principal) {
        return userService.getCurrentUser(principal.getName()).getId();
    }
}
