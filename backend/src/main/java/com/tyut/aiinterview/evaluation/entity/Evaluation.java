package com.tyut.aiinterview.evaluation.entity;

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
@TableName("evaluation")
public class Evaluation {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("interview_question_id")
    private Long interviewQuestionId;

    @TableField("evaluator_id")
    private Long evaluatorId;

    @TableField("source")
    private String source;

    @TableField("professional_score")
    private BigDecimal professionalScore;

    @TableField("expression_score")
    private BigDecimal expressionScore;

    @TableField("logic_score")
    private BigDecimal logicScore;

    @TableField("adaptability_score")
    private BigDecimal adaptabilityScore;

    @TableField("overall_score")
    private BigDecimal overallScore;

    @TableField("comment")
    private String comment;

    @TableField("status")
    private Integer status;

    @TableField("confirmed_by")
    private Long confirmedBy;

    @TableField("confirmed_at")
    private LocalDateTime confirmedAt;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
