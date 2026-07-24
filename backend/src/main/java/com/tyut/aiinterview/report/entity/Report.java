package com.tyut.aiinterview.report.entity;

import com.baomidou.mybatisplus.annotation.*;
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
@TableName("report")
public class Report {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("interview_id")
    private Long interviewId;

    @TableField("total_score")
    private BigDecimal totalScore;

    @TableField("professional_score")
    private BigDecimal professionalScore;

    @TableField("expression_score")
    private BigDecimal expressionScore;

    @TableField("logic_score")
    private BigDecimal logicScore;

    @TableField("adaptability_score")
    private BigDecimal adaptabilityScore;

    @TableField("summary")
    private String summary;

    @TableField("strengths")
    private String strengths;

    @TableField("weaknesses")
    private String weaknesses;

    @TableField("improvement_suggestions")
    private String improvementSuggestions;

    @TableField("generation_method")
    private String generationMethod;

    @TableField("generated_by")
    private Long generatedBy;

    @TableField("pdf_url")
    private String pdfUrl;

    @TableField(value = "generated_at", fill = FieldFill.INSERT)
    private LocalDateTime generatedAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
