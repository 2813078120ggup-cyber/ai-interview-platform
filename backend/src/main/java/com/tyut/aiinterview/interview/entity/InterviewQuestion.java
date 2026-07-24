package com.tyut.aiinterview.interview.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("interview_question")
public class InterviewQuestion {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long interviewId;
    private Long questionId;
    private Integer sequenceNo;
    private BigDecimal maxScore;
    private String questionSnapshot;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    // -- getters --
    public Long getId() { return id; }
    public Long getInterviewId() { return interviewId; }
    public Long getQuestionId() { return questionId; }
    public Integer getSequenceNo() { return sequenceNo; }
    public BigDecimal getMaxScore() { return maxScore; }
    public String getQuestionSnapshot() { return questionSnapshot; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public void setSequenceNo(Integer sequenceNo) { this.sequenceNo = sequenceNo; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public void setQuestionSnapshot(String questionSnapshot) { this.questionSnapshot = questionSnapshot; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
