package com.tyut.aiinterview.report.service;

import com.tyut.aiinterview.report.dto.ReportVO;

import java.util.List;

public interface ReportService {

    ReportVO generateReport(Long interviewId, Long operatorId);

    ReportVO publishReport(Long interviewId, Long operatorId);

    ReportVO getReportByInterviewId(Long interviewId);

    ReportVO getReportById(Long id);

    List<ReportVO> listReports(String role, Long userId);
}
