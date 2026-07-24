package com.tyut.aiinterview.interview.dto;

import jakarta.validation.constraints.NotBlank;

public class SubmitAnswerRequest {

    @NotBlank(message = "作答内容不能为空")
    private String answerContent;

    private String answerData;
    private String audioUrl;
    private Integer durationSeconds;

    // -- getters and setters --
    public String getAnswerContent() { return answerContent; }
    public void setAnswerContent(String answerContent) { this.answerContent = answerContent; }
    public String getAnswerData() { return answerData; }
    public void setAnswerData(String answerData) { this.answerData = answerData; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
}
