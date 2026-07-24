package com.tyut.aiinterview.domain;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;

@TableName("interview_question")
public class InterviewQuestion {
    @TableId("id")
    private Long id;
    private Long interviewId;
    private Long questionId;
    private Integer sequenceNo;
    private BigDecimal maxScore;
    private String questionSnapshot;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Integer getSequenceNo() { return sequenceNo; }
    public void setSequenceNo(Integer sequenceNo) { this.sequenceNo = sequenceNo; }
    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public String getQuestionSnapshot() { return questionSnapshot; }
    public void setQuestionSnapshot(String questionSnapshot) { this.questionSnapshot = questionSnapshot; }
}
