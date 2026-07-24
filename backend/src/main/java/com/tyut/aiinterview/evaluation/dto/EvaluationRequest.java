package com.tyut.aiinterview.evaluation.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class EvaluationRequest {

    @NotNull(message = "专业能力得分不能为空")
    private BigDecimal professionalScore;

    @NotNull(message = "表达能力得分不能为空")
    private BigDecimal expressionScore;

    @NotNull(message = "逻辑思维得分不能为空")
    private BigDecimal logicScore;

    @NotNull(message = "应变能力得分不能为空")
    private BigDecimal adaptabilityScore;

    @NotNull(message = "综合得分不能为空")
    private BigDecimal overallScore;

    private String comment;

    // -- getters and setters --
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
}
