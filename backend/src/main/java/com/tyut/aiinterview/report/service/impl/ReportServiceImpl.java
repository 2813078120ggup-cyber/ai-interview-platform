package com.tyut.aiinterview.report.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tyut.aiinterview.ai.service.AiService;
import com.tyut.aiinterview.evaluation.dto.EvaluationResponse;
import com.tyut.aiinterview.evaluation.service.EvaluationService;
import com.tyut.aiinterview.report.dto.ReportRequest;
import com.tyut.aiinterview.report.dto.ReportResponse;
import com.tyut.aiinterview.report.entity.Report;
import com.tyut.aiinterview.report.mapper.ReportMapper;
import com.tyut.aiinterview.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl extends ServiceImpl<ReportMapper, Report> implements ReportService {

    private final AiService aiService;
    private final EvaluationService evaluationService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public ReportResponse createReport(ReportRequest request) {
        Report report = Report.builder()
                .interviewId(request.getInterviewId())
                .totalScore(request.getTotalScore())
                .professionalScore(request.getProfessionalScore())
                .expressionScore(request.getExpressionScore())
                .logicScore(request.getLogicScore())
                .adaptabilityScore(request.getAdaptabilityScore())
                .summary(request.getSummary())
                .strengths(request.getStrengths())
                .weaknesses(request.getWeaknesses())
                .improvementSuggestions(request.getImprovementSuggestions())
                .generationMethod(request.getGenerationMethod() != null ? request.getGenerationMethod() : "manual")
                .generatedBy(request.getGeneratedBy())
                .build();
        this.save(report);
        log.info("Created report: {}", report.getId());
        return convertToResponse(report);
    }

    @Override
    public ReportResponse getReportById(Long id) {
        Report report = this.getById(id);
        return report != null ? convertToResponse(report) : null;
    }

    @Override
    public ReportResponse getReportByInterviewId(Long interviewId) {
        LambdaQueryWrapper<Report> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Report::getInterviewId, interviewId);
        Report report = this.getOne(wrapper);
        return report != null ? convertToResponse(report) : null;
    }

    @Override
    @Transactional
    public ReportResponse updateReport(Long id, ReportRequest request) {
        Report report = this.getById(id);
        if (report == null) {
            return null;
        }
        if (request.getTotalScore() != null) {
            report.setTotalScore(request.getTotalScore());
        }
        if (request.getProfessionalScore() != null) {
            report.setProfessionalScore(request.getProfessionalScore());
        }
        if (request.getExpressionScore() != null) {
            report.setExpressionScore(request.getExpressionScore());
        }
        if (request.getLogicScore() != null) {
            report.setLogicScore(request.getLogicScore());
        }
        if (request.getAdaptabilityScore() != null) {
            report.setAdaptabilityScore(request.getAdaptabilityScore());
        }
        if (request.getSummary() != null) {
            report.setSummary(request.getSummary());
        }
        if (request.getStrengths() != null) {
            report.setStrengths(request.getStrengths());
        }
        if (request.getWeaknesses() != null) {
            report.setWeaknesses(request.getWeaknesses());
        }
        if (request.getImprovementSuggestions() != null) {
            report.setImprovementSuggestions(request.getImprovementSuggestions());
        }
        if (request.getGenerationMethod() != null) {
            report.setGenerationMethod(request.getGenerationMethod());
        }
        if (request.getGeneratedBy() != null) {
            report.setGeneratedBy(request.getGeneratedBy());
        }
        this.updateById(report);
        log.info("Updated report: {}", id);
        return convertToResponse(report);
    }

    @Override
    @Transactional
    public void deleteReport(Long id) {
        this.removeById(id);
        log.info("Deleted report: {}", id);
    }

    @Override
    @Transactional
    public ReportResponse generateAiReport(Long interviewId) {
        log.info("Starting AI report generation for interview: {}", interviewId);

        List<EvaluationResponse> evaluations = evaluationService.getEvaluationsByInterviewId(interviewId);
        
        if (evaluations.isEmpty()) {
            log.warn("No evaluations found for interview: {}", interviewId);
            return null;
        }

        BigDecimal avgProfessionalScore = evaluations.stream()
                .map(EvaluationResponse::getProfessionalScore)
                .filter(s -> s != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(evaluations.size()), 2, RoundingMode.HALF_UP);

        BigDecimal avgExpressionScore = evaluations.stream()
                .map(EvaluationResponse::getExpressionScore)
                .filter(s -> s != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(evaluations.size()), 2, RoundingMode.HALF_UP);

        BigDecimal avgLogicScore = evaluations.stream()
                .map(EvaluationResponse::getLogicScore)
                .filter(s -> s != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(evaluations.size()), 2, RoundingMode.HALF_UP);

        BigDecimal avgAdaptabilityScore = evaluations.stream()
                .map(EvaluationResponse::getAdaptabilityScore)
                .filter(s -> s != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(evaluations.size()), 2, RoundingMode.HALF_UP);

        BigDecimal totalScore = avgProfessionalScore.add(avgExpressionScore)
                .add(avgLogicScore).add(avgAdaptabilityScore)
                .divide(BigDecimal.valueOf(4), 2, RoundingMode.HALF_UP);

        String interviewSummary = String.format(
                "面试ID：%d，共%d道题目，综合评分：%.2f分",
                interviewId, evaluations.size(), totalScore
        );

        List<String> evaluationComments = evaluations.stream()
                .map(e -> String.format("题目%d：专业%.2f分，表达%.2f分，逻辑%.2f分，应变%.2f分",
                        e.getId(), e.getProfessionalScore(), e.getExpressionScore(),
                        e.getLogicScore(), e.getAdaptabilityScore()))
                .collect(Collectors.toList());

        String aiResponse = aiService.generateInterviewReport(interviewSummary, evaluationComments);

        try {
            JsonNode jsonNode = objectMapper.readTree(aiResponse);

            String summary = jsonNode.has("summary") ? jsonNode.get("summary").asText() : aiResponse;
            String strengths = jsonNode.has("strengths") ? jsonNode.get("strengths").asText() : "";
            String weaknesses = jsonNode.has("weaknesses") ? jsonNode.get("weaknesses").asText() : "";
            String improvementSuggestions = jsonNode.has("improvementSuggestions") 
                    ? jsonNode.get("improvementSuggestions").asText() : "";

            Report report = Report.builder()
                    .interviewId(interviewId)
                    .totalScore(totalScore)
                    .professionalScore(avgProfessionalScore)
                    .expressionScore(avgExpressionScore)
                    .logicScore(avgLogicScore)
                    .adaptabilityScore(avgAdaptabilityScore)
                    .summary(summary)
                    .strengths(strengths)
                    .weaknesses(weaknesses)
                    .improvementSuggestions(improvementSuggestions)
                    .generationMethod("ai")
                    .build();

            this.save(report);
            log.info("Created AI report: {}", report.getId());
            return convertToResponse(report);
        } catch (Exception e) {
            log.warn("Failed to parse AI report response as JSON: {}", e.getMessage());

            Report report = Report.builder()
                    .interviewId(interviewId)
                    .totalScore(totalScore)
                    .professionalScore(avgProfessionalScore)
                    .expressionScore(avgExpressionScore)
                    .logicScore(avgLogicScore)
                    .adaptabilityScore(avgAdaptabilityScore)
                    .summary(aiResponse)
                    .strengths("")
                    .weaknesses("")
                    .improvementSuggestions("")
                    .generationMethod("ai")
                    .build();

            this.save(report);
            log.info("Created AI report with raw response: {}", report.getId());
            return convertToResponse(report);
        }
    }

    private ReportResponse convertToResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .interviewId(report.getInterviewId())
                .totalScore(report.getTotalScore())
                .professionalScore(report.getProfessionalScore())
                .expressionScore(report.getExpressionScore())
                .logicScore(report.getLogicScore())
                .adaptabilityScore(report.getAdaptabilityScore())
                .summary(report.getSummary())
                .strengths(report.getStrengths())
                .weaknesses(report.getWeaknesses())
                .improvementSuggestions(report.getImprovementSuggestions())
                .generationMethod(report.getGenerationMethod())
                .generatedBy(report.getGeneratedBy())
                .pdfUrl(report.getPdfUrl())
                .generatedAt(report.getGeneratedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
