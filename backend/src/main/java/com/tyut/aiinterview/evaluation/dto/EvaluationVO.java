package com.tyut.aiinterview.evaluation.dto;

import com.tyut.aiinterview.evaluation.entity.Evaluation;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EvaluationVO {

    private Long id;
    private Long interviewQuestionId;
    private Long evaluatorId;
    private String evaluatorName;
    private String source;
    private BigDecimal professionalScore;
    private BigDecimal expressionScore;
    private BigDecimal logicScore;
    private BigDecimal adaptabilityScore;
    private BigDecimal overallScore;
    private String comment;
    private Integer status;
    private LocalDateTime createdAt;

    public static EvaluationVO from(Evaluation e) {
        EvaluationVO vo = new EvaluationVO();
        vo.id = e.getId();
        vo.interviewQuestionId = e.getInterviewQuestionId();
        vo.evaluatorId = e.getEvaluatorId();
        vo.source = e.getSource();
        vo.professionalScore = e.getProfessionalScore();
        vo.expressionScore = e.getExpressionScore();
        vo.logicScore = e.getLogicScore();
        vo.adaptabilityScore = e.getAdaptabilityScore();
        vo.overallScore = e.getOverallScore();
        vo.comment = e.getComment();
        vo.status = e.getStatus();
        vo.createdAt = e.getCreatedAt();
        return vo;
    }

    // -- getters and setters --
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInterviewQuestionId() { return interviewQuestionId; }
    public void setInterviewQuestionId(Long interviewQuestionId) { this.interviewQuestionId = interviewQuestionId; }
    public Long getEvaluatorId() { return evaluatorId; }
    public void setEvaluatorId(Long evaluatorId) { this.evaluatorId = evaluatorId; }
    public String getEvaluatorName() { return evaluatorName; }
    public void setEvaluatorName(String evaluatorName) { this.evaluatorName = evaluatorName; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public BigDecimal getProfessionalScore() { return professionalScore; }
    public void setProfessionalScore(BigDecimal professionalScore) { this.professionalScore = professionalScore; }
    public BigDecimal getExpressionScore() { return expressionScore; }
    public void setExpressionScore(BigDecimal expressionScore) { this.expressionScore = expressionScore; }
    public BigDecimal getLogicScore() { return logicScore; }
    public void setLogicScore(BigDecimal logicScore) { this.logicScore = logicScore; }
    public BigDecimal getAdaptabilityScore() { return adaptabilityScore; }
    public void setAdaptabilityScore(BigDecimal adaptabilityScore) { this.adaptabilityScore = adaptabilityScore; }
    public BigDecimal getOverallScore() { return overallScore; }
    public void setOverallScore(BigDecimal overallScore) { this.overallScore = overallScore; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
