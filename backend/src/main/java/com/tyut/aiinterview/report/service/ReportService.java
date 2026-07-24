package com.tyut.aiinterview.report.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.tyut.aiinterview.report.dto.ReportRequest;
import com.tyut.aiinterview.report.dto.ReportResponse;
import com.tyut.aiinterview.report.entity.Report;

public interface ReportService extends IService<Report> {

    ReportResponse createReport(ReportRequest request);

    ReportResponse getReportById(Long id);

    ReportResponse getReportByInterviewId(Long interviewId);

    ReportResponse updateReport(Long id, ReportRequest request);

    void deleteReport(Long id);

    ReportResponse generateAiReport(Long interviewId);
}
