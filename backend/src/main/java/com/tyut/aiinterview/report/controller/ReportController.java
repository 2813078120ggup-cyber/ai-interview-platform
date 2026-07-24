package com.tyut.aiinterview.report.controller;

import com.tyut.aiinterview.common.ApiResult;
import com.tyut.aiinterview.report.dto.ReportVO;
import com.tyut.aiinterview.report.service.ReportService;
import com.tyut.aiinterview.user.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;

    public ReportController(ReportService reportService, UserService userService) {
        this.reportService = reportService;
        this.userService = userService;
    }

    @PostMapping("/generate/{interviewId}")
    public ApiResult<ReportVO> generateReport(@PathVariable Long interviewId, Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(reportService.generateReport(interviewId, userId));
    }

    @PutMapping("/publish/{interviewId}")
    public ApiResult<ReportVO> publishReport(@PathVariable Long interviewId, Principal principal) {
        Long userId = getUserId(principal);
        return ApiResult.success(reportService.publishReport(interviewId, userId));
    }

    @GetMapping("/interview/{interviewId}")
    public ApiResult<ReportVO> getReportByInterview(@PathVariable Long interviewId) {
        return ApiResult.success(reportService.getReportByInterviewId(interviewId));
    }

    @GetMapping("/{id}")
    public ApiResult<ReportVO> getReport(@PathVariable Long id) {
        return ApiResult.success(reportService.getReportById(id));
    }

    @GetMapping
    public ApiResult<List<ReportVO>> listReports(Principal principal) {
        var userInfo = userService.getCurrentUser(principal.getName());
        String role = userInfo.getRoles().stream()
                .filter(r -> List.of("HR", "ADMIN", "INTERVIEWER", "CANDIDATE").contains(r))
                .findFirst().orElse("CANDIDATE");
        return ApiResult.success(reportService.listReports(role, userInfo.getId()));
    }

    private Long getUserId(Principal principal) {
        return userService.getCurrentUser(principal.getName()).getId();
    }
}
