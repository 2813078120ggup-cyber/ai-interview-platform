package com.tyut.aiinterview.evaluation.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("evaluation")
public class Evaluation {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long interviewQuestionId;
    private Long evaluatorId;
    private String source;
    private BigDecimal professionalScore;
    private BigDecimal expressionScore;
    private BigDecimal logicScore;
    private BigDecimal adaptabilityScore;
    private BigDecimal overallScore;
    private String comment;
    private Integer status;
    private Long confirmedBy;
    private LocalDateTime confirmedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // -- getters --
    public Long getId() { return id; }
    public Long getInterviewQuestionId() { return interviewQuestionId; }
    public Long getEvaluatorId() { return evaluatorId; }
    public String getSource() { return source; }
    public BigDecimal getProfessionalScore() { return professionalScore; }
    public BigDecimal getExpressionScore() { return expressionScore; }
    public BigDecimal getLogicScore() { return logicScore; }
    public BigDecimal getAdaptabilityScore() { return adaptabilityScore; }
    public BigDecimal getOverallScore() { return overallScore; }
    public String getComment() { return comment; }
    public Integer getStatus() { return status; }
    public Long getConfirmedBy() { return confirmedBy; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setInterviewQuestionId(Long interviewQuestionId) { this.interviewQuestionId = interviewQuestionId; }
    public void setEvaluatorId(Long evaluatorId) { this.evaluatorId = evaluatorId; }
    public void setSource(String source) { this.source = source; }
    public void setProfessionalScore(BigDecimal professionalScore) { this.professionalScore = professionalScore; }
    public void setExpressionScore(BigDecimal expressionScore) { this.expressionScore = expressionScore; }
    public void setLogicScore(BigDecimal logicScore) { this.logicScore = logicScore; }
    public void setAdaptabilityScore(BigDecimal adaptabilityScore) { this.adaptabilityScore = adaptabilityScore; }
    public void setOverallScore(BigDecimal overallScore) { this.overallScore = overallScore; }
    public void setComment(String comment) { this.comment = comment; }
    public void setStatus(Integer status) { this.status = status; }
    public void setConfirmedBy(Long confirmedBy) { this.confirmedBy = confirmedBy; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
