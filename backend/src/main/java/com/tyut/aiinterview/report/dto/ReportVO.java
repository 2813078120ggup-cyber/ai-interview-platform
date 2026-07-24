package com.tyut.aiinterview.report.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReportVO {

    private Long id;
    private Long interviewId;
    private String interviewTitle;
    private String candidateName;
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
    private Integer published;
    private String pdfUrl;
    private LocalDateTime generatedAt;

    // -- getters and setters --
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public String getInterviewTitle() { return interviewTitle; }
    public void setInterviewTitle(String interviewTitle) { this.interviewTitle = interviewTitle; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public BigDecimal getTotalScore() { return totalScore; }
    public void setTotalScore(BigDecimal totalScore) { this.totalScore = totalScore; }
    public BigDecimal getProfessionalScore() { return professionalScore; }
    public void setProfessionalScore(BigDecimal professionalScore) { this.professionalScore = professionalScore; }
    public BigDecimal getExpressionScore() { return expressionScore; }
    public void setExpressionScore(BigDecimal expressionScore) { this.expressionScore = expressionScore; }
    public BigDecimal getLogicScore() { return logicScore; }
    public void setLogicScore(BigDecimal logicScore) { this.logicScore = logicScore; }
    public BigDecimal getAdaptabilityScore() { return adaptabilityScore; }
    public void setAdaptabilityScore(BigDecimal adaptabilityScore) { this.adaptabilityScore = adaptabilityScore; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getWeaknesses() { return weaknesses; }
    public void setWeaknesses(String weaknesses) { this.weaknesses = weaknesses; }
    public String getImprovementSuggestions() { return improvementSuggestions; }
    public void setImprovementSuggestions(String improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }
    public String getGenerationMethod() { return generationMethod; }
    public void setGenerationMethod(String generationMethod) { this.generationMethod = generationMethod; }
    public Integer getPublished() { return published; }
    public void setPublished(Integer published) { this.published = published; }
    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
