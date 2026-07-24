package com.tyut.aiinterview.report.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("report")
public class Report {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long interviewId;
    private BigDecimal totalScore;
    private BigDecimal professionalScore;
    private BigDecimal expressionScore;
    private BigDecimal logicScore;
    private BigDecimal adaptabilityScore;
    private String summary;
    private String strengths;
    private String weaknesses;
    private String improvementSuggestions;
    private String generationMethod;
    private Long generatedBy;
    private String pdfUrl;
    private Integer published;
    private LocalDateTime generatedAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // -- getters --
    public Long getId() { return id; }
    public Long getInterviewId() { return interviewId; }
    public BigDecimal getTotalScore() { return totalScore; }
    public BigDecimal getProfessionalScore() { return professionalScore; }
    public BigDecimal getExpressionScore() { return expressionScore; }
    public BigDecimal getLogicScore() { return logicScore; }
    public BigDecimal getAdaptabilityScore() { return adaptabilityScore; }
    public String getSummary() { return summary; }
    public String getStrengths() { return strengths; }
    public String getWeaknesses() { return weaknesses; }
    public String getImprovementSuggestions() { return improvementSuggestions; }
    public String getGenerationMethod() { return generationMethod; }
    public Long getGeneratedBy() { return generatedBy; }
    public String getPdfUrl() { return pdfUrl; }
    public Integer getPublished() { return published; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public void setTotalScore(BigDecimal totalScore) { this.totalScore = totalScore; }
    public void setProfessionalScore(BigDecimal professionalScore) { this.professionalScore = professionalScore; }
    public void setExpressionScore(BigDecimal expressionScore) { this.expressionScore = expressionScore; }
    public void setLogicScore(BigDecimal logicScore) { this.logicScore = logicScore; }
    public void setAdaptabilityScore(BigDecimal adaptabilityScore) { this.adaptabilityScore = adaptabilityScore; }
    public void setSummary(String summary) { this.summary = summary; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public void setWeaknesses(String weaknesses) { this.weaknesses = weaknesses; }
    public void setImprovementSuggestions(String improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }
    public void setGenerationMethod(String generationMethod) { this.generationMethod = generationMethod; }
    public void setGeneratedBy(Long generatedBy) { this.generatedBy = generatedBy; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }
    public void setPublished(Integer published) { this.published = published; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
