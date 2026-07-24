package com.tyut.aiinterview.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

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
    private LocalDateTime generatedAt;
    private LocalDateTime updatedAt;
}
