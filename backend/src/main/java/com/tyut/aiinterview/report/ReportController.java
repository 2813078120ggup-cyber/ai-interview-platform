package com.tyut.aiinterview.report;

import com.tyut.aiinterview.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/interviews")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/{interviewId}/report")
    public ApiResponse<ReportDtos.ReportView> byInterview(@PathVariable Long interviewId) {
        return ApiResponse.success(reportService.byInterview(interviewId));
    }
}
