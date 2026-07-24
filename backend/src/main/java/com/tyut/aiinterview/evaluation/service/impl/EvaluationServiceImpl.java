package com.tyut.aiinterview.evaluation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tyut.aiinterview.ai.service.AiService;
import com.tyut.aiinterview.evaluation.dto.EvaluationRequest;
import com.tyut.aiinterview.evaluation.dto.EvaluationResponse;
import com.tyut.aiinterview.evaluation.entity.Evaluation;
import com.tyut.aiinterview.evaluation.mapper.EvaluationMapper;
import com.tyut.aiinterview.evaluation.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationServiceImpl extends ServiceImpl<EvaluationMapper, Evaluation> implements EvaluationService {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public EvaluationResponse createEvaluation(EvaluationRequest request) {
        Evaluation evaluation = Evaluation.builder()
                .interviewQuestionId(request.getInterviewQuestionId())
                .evaluatorId(request.getEvaluatorId())
                .source(request.getSource())
                .professionalScore(request.getProfessionalScore())
                .expressionScore(request.getExpressionScore())
                .logicScore(request.getLogicScore())
                .adaptabilityScore(request.getAdaptabilityScore())
                .overallScore(request.getOverallScore())
                .comment(request.getComment())
                .status(request.getStatus() != null ? request.getStatus() : 0)
                .build();
        this.save(evaluation);
        log.info("Created evaluation: {}", evaluation.getId());
        return convertToResponse(evaluation);
    }

    @Override
    public EvaluationResponse getEvaluationById(Long id) {
        Evaluation evaluation = this.getById(id);
        return evaluation != null ? convertToResponse(evaluation) : null;
    }

    @Override
    public List<EvaluationResponse> getEvaluationsByInterviewQuestionId(Long interviewQuestionId) {
        LambdaQueryWrapper<Evaluation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Evaluation::getInterviewQuestionId, interviewQuestionId);
        List<Evaluation> evaluations = this.list(wrapper);
        return evaluations.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    @Override
    public List<EvaluationResponse> getEvaluationsByInterviewId(Long interviewId) {
        return baseMapper.findByInterviewId(interviewId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EvaluationResponse updateEvaluation(Long id, EvaluationRequest request) {
        Evaluation evaluation = this.getById(id);
        if (evaluation == null) {
            return null;
        }
        if (request.getProfessionalScore() != null) {
            evaluation.setProfessionalScore(request.getProfessionalScore());
        }
        if (request.getExpressionScore() != null) {
            evaluation.setExpressionScore(request.getExpressionScore());
        }
        if (request.getLogicScore() != null) {
            evaluation.setLogicScore(request.getLogicScore());
        }
        if (request.getAdaptabilityScore() != null) {
            evaluation.setAdaptabilityScore(request.getAdaptabilityScore());
        }
        if (request.getOverallScore() != null) {
            evaluation.setOverallScore(request.getOverallScore());
        }
        if (request.getComment() != null) {
            evaluation.setComment(request.getComment());
        }
        if (request.getStatus() != null) {
            evaluation.setStatus(request.getStatus());
        }
        this.updateById(evaluation);
        log.info("Updated evaluation: {}", id);
        return convertToResponse(evaluation);
    }

    @Override
    @Transactional
    public EvaluationResponse confirmEvaluation(Long id, Long confirmedBy) {
        Evaluation evaluation = this.getById(id);
        if (evaluation == null) {
            return null;
        }
        evaluation.setStatus(1);
        evaluation.setConfirmedBy(confirmedBy);
        evaluation.setConfirmedAt(LocalDateTime.now());
        this.updateById(evaluation);
        log.info("Confirmed evaluation: {}", id);
        return convertToResponse(evaluation);
    }

    @Override
    @Transactional
    public void deleteEvaluation(Long id) {
        this.removeById(id);
        log.info("Deleted evaluation: {}", id);
    }

    @Override
    @Transactional
    public EvaluationResponse createAiEvaluation(Long interviewQuestionId, String question, String answer) {
        log.info("Starting AI evaluation for interview question: {}", interviewQuestionId);

        String evaluationCriteria = "专业能力：评估候选人对技术知识的掌握程度和深度\n" +
                "表达能力：评估候选人的沟通表达能力和语言组织能力\n" +
                "逻辑思维：评估候选人的思维逻辑性和分析问题的能力\n" +
                "应变能力：评估候选人面对问题时的反应和解决问题的能力";

        String aiResponse = aiService.evaluateAnswer(question, answer, evaluationCriteria);

        try {
            JsonNode jsonNode = objectMapper.readTree(aiResponse);
            
            BigDecimal professionalScore = parseScore(jsonNode, "professionalScore");
            BigDecimal expressionScore = parseScore(jsonNode, "expressionScore");
            BigDecimal logicScore = parseScore(jsonNode, "logicScore");
            BigDecimal adaptabilityScore = parseScore(jsonNode, "adaptabilityScore");
            BigDecimal overallScore = parseScore(jsonNode, "overallScore");
            String comment = jsonNode.has("comment") ? jsonNode.get("comment").asText() : aiResponse;

            Evaluation evaluation = Evaluation.builder()
                    .interviewQuestionId(interviewQuestionId)
                    .evaluatorId(null)
                    .source("ai")
                    .professionalScore(professionalScore != null ? professionalScore : BigDecimal.ZERO)
                    .expressionScore(expressionScore != null ? expressionScore : BigDecimal.ZERO)
                    .logicScore(logicScore != null ? logicScore : BigDecimal.ZERO)
                    .adaptabilityScore(adaptabilityScore != null ? adaptabilityScore : BigDecimal.ZERO)
                    .overallScore(overallScore != null ? overallScore : calculateOverallScore(
                            professionalScore, expressionScore, logicScore, adaptabilityScore))
                    .comment(comment)
                    .status(0)
                    .build();

            this.save(evaluation);
            log.info("Created AI evaluation: {}", evaluation.getId());
            return convertToResponse(evaluation);
        } catch (Exception e) {
            log.warn("Failed to parse AI evaluation response as JSON, saving raw response: {}", e.getMessage());
            
            BigDecimal defaultScore = BigDecimal.valueOf(50);
            Evaluation evaluation = Evaluation.builder()
                    .interviewQuestionId(interviewQuestionId)
                    .evaluatorId(null)
                    .source("ai")
                    .professionalScore(defaultScore)
                    .expressionScore(defaultScore)
                    .logicScore(defaultScore)
                    .adaptabilityScore(defaultScore)
                    .overallScore(defaultScore)
                    .comment(aiResponse)
                    .status(0)
                    .build();

            this.save(evaluation);
            log.info("Created AI evaluation with default scores: {}", evaluation.getId());
            return convertToResponse(evaluation);
        }
    }

    private BigDecimal parseScore(JsonNode node, String fieldName) {
        if (node.has(fieldName)) {
            try {
                return new BigDecimal(node.get(fieldName).asText());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private BigDecimal calculateOverallScore(BigDecimal... scores) {
        BigDecimal sum = BigDecimal.ZERO;
        int count = 0;
        for (BigDecimal score : scores) {
            if (score != null) {
                sum = sum.add(score);
                count++;
            }
        }
        return count > 0 ? sum.divide(BigDecimal.valueOf(count), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    private EvaluationResponse convertToResponse(Evaluation evaluation) {
        return EvaluationResponse.builder()
                .id(evaluation.getId())
                .interviewQuestionId(evaluation.getInterviewQuestionId())
                .evaluatorId(evaluation.getEvaluatorId())
                .source(evaluation.getSource())
                .professionalScore(evaluation.getProfessionalScore())
                .expressionScore(evaluation.getExpressionScore())
                .logicScore(evaluation.getLogicScore())
                .adaptabilityScore(evaluation.getAdaptabilityScore())
                .overallScore(evaluation.getOverallScore())
                .comment(evaluation.getComment())
                .status(evaluation.getStatus())
                .confirmedBy(evaluation.getConfirmedBy())
                .confirmedAt(evaluation.getConfirmedAt())
                .createdAt(evaluation.getCreatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }
}
