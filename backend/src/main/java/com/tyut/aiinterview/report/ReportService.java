package com.tyut.aiinterview.report;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.domain.Report;
import com.tyut.aiinterview.mapper.ReportMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
    private final ReportMapper reportMapper;

    public ReportService(ReportMapper reportMapper) {
        this.reportMapper = reportMapper;
    }

    public ReportDtos.ReportView byInterview(Long interviewId) {
        Report report = reportMapper.selectOne(new LambdaQueryWrapper<Report>().eq(Report::getInterviewId, interviewId));
        if (report == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "面试报告不存在");
        }
        return new ReportDtos.ReportView(report.getId(), report.getInterviewId(), report.getTotalScore(),
                report.getProfessionalScore(), report.getExpressionScore(), report.getLogicScore(),
                report.getAdaptabilityScore(), report.getSummary(), report.getStrengths(), report.getWeaknesses(),
                report.getImprovementSuggestions(), report.getGenerationMethod(), report.getPdfUrl());
    }
}
