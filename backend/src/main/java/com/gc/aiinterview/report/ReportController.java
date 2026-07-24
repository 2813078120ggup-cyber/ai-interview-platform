package com.gc.aiinterview.report;

import com.gc.aiinterview.common.ApiResponse;
import com.gc.aiinterview.domain.Report;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/interviews/{interviewId}/report")
public class ReportController {
    private final ReportService service;
    public ReportController(ReportService service) { this.service = service; }
    @GetMapping public ApiResponse<Report> get(@PathVariable Long interviewId) { return ApiResponse.ok(service.get(interviewId)); }
    @PostMapping public ApiResponse<Report> generate(@PathVariable Long interviewId) { return ApiResponse.ok(service.generate(interviewId)); }
    @PostMapping("/publish") public ApiResponse<Report> publish(@PathVariable Long interviewId) { return ApiResponse.ok(service.publish(interviewId)); }
}
