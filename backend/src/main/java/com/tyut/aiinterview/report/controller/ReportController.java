package com.tyut.aiinterview.report.controller;

import com.tyut.aiinterview.common.api.ApiResponse;
import com.tyut.aiinterview.report.dto.ReportRequest;
import com.tyut.aiinterview.report.dto.ReportResponse;
import com.tyut.aiinterview.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(@RequestBody ReportRequest request) {
        ReportResponse response = reportService.createReport(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReport(@PathVariable Long id) {
        ReportResponse response = reportService.getReportById(id);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.error("Report not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportByInterview(@PathVariable Long interviewId) {
        ReportResponse response = reportService.getReportByInterviewId(interviewId);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.error("Report not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportResponse>> updateReport(
            @PathVariable Long id, @RequestBody ReportRequest request) {
        ReportResponse response = reportService.updateReport(id, request);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.error("Report not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/ai/{interviewId}")
    public ResponseEntity<ApiResponse<ReportResponse>> generateAiReport(@PathVariable Long interviewId) {
        ReportResponse response = reportService.generateAiReport(interviewId);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.error("Failed to generate AI report"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
