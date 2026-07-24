package com.tyut.aiinterview.interview.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("interview_answer")
public class InterviewAnswer {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long interviewQuestionId;
    private String answerContent;
    private String answerData;
    private String audioUrl;
    private Integer durationSeconds;
    private LocalDateTime answeredAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // -- getters --
    public Long getId() { return id; }
    public Long getInterviewQuestionId() { return interviewQuestionId; }
    public String getAnswerContent() { return answerContent; }
    public String getAnswerData() { return answerData; }
    public String getAudioUrl() { return audioUrl; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public LocalDateTime getAnsweredAt() { return answeredAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setInterviewQuestionId(Long interviewQuestionId) { this.interviewQuestionId = interviewQuestionId; }
    public void setAnswerContent(String answerContent) { this.answerContent = answerContent; }
    public void setAnswerData(String answerData) { this.answerData = answerData; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public void setAnsweredAt(LocalDateTime answeredAt) { this.answeredAt = answeredAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
