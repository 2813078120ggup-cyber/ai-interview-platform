package com.tyut.aiinterview.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class ReportDtos {
    private ReportDtos() {
    }

    public record ReportQuery(Long pageNo, Long pageSize, String keyword) {
    }

    public record ReportListItem(Long reportId, Long interviewId, String interviewTitle, Long candidateId,
                                 String candidateName, String candidateUsername, LocalDateTime scheduledAt,
                                 BigDecimal totalScore, BigDecimal professionalScore, BigDecimal expressionScore,
                                 BigDecimal logicScore, BigDecimal adaptabilityScore, Integer status,
                                 LocalDateTime publishedAt) {
    }

    public record TrendPoint(Long interviewId, String interviewTitle, LocalDateTime scheduledAt,
                             BigDecimal totalScore, BigDecimal professionalScore, BigDecimal expressionScore,
                             BigDecimal logicScore, BigDecimal adaptabilityScore) {
    }

    public record ScoreChange(BigDecimal totalScore, BigDecimal professionalScore, BigDecimal expressionScore,
                              BigDecimal logicScore, BigDecimal adaptabilityScore) {
    }

    public record CandidateAbilitySummary(long reportCount, TrendPoint latest, TrendPoint previous,
                                          ScoreChange changeFromPrevious, List<TrendPoint> trends) {
    }
}
