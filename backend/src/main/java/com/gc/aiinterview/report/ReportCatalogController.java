package com.gc.aiinterview.report;

import com.gc.aiinterview.common.ApiResponse;
import com.gc.aiinterview.common.PageResult;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/reports")
public class ReportCatalogController {
    private final ReportService service;

    public ReportCatalogController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/page")
    public ApiResponse<PageResult<ReportDtos.ReportListItem>> page(@Valid ReportDtos.ReportQuery query) {
        return ApiResponse.ok(service.pageForAdmin(query));
    }

    @GetMapping("/my/summary")
    public ApiResponse<ReportDtos.CandidateAbilitySummary> mySummary() {
        return ApiResponse.ok(service.myAbilitySummary());
    }
}
