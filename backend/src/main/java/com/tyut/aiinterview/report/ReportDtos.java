package com.tyut.aiinterview.report;

import java.math.BigDecimal;

public final class ReportDtos {
    private ReportDtos() {
    }

    public record ReportView(Long id, Long interviewId, BigDecimal totalScore, BigDecimal professionalScore,
                             BigDecimal expressionScore, BigDecimal logicScore, BigDecimal adaptabilityScore,
                             String summary, String strengths, String weaknesses, String improvementSuggestions,
                             String generationMethod, String pdfUrl) {
    }
}
