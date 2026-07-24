package com.tyut.aiinterview.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class QuestionRequest {

    @NotNull(message = "题库ID不能为空")
    private Long bankId;

    @NotBlank(message = "题型不能为空")
    private String questionType;

    @NotNull(message = "难度不能为空")
    private Integer difficulty;

    @NotBlank(message = "题目内容不能为空")
    private String content;

    private String options;
    private String correctAnswer;
    private String answerTemplate;
    private String explanation;
    private String tags;

    @NotNull(message = "分数不能为空")
    private BigDecimal score;

    private Integer sortOrder;

    // -- getters and setters --
    public Long getBankId() { return bankId; }
    public void setBankId(Long bankId) { this.bankId = bankId; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }
    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
    public String getAnswerTemplate() { return answerTemplate; }
    public void setAnswerTemplate(String answerTemplate) { this.answerTemplate = answerTemplate; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
