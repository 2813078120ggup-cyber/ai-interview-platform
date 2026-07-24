package com.tyut.aiinterview.question.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("question")
public class Question {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long bankId;
    private String questionType;
    private Integer difficulty;
    private String content;
    private String options;
    private String correctAnswer;
    private String answerTemplate;
    private String explanation;
    private String tags;
    private BigDecimal score;
    private Integer sortOrder;
    private Integer status;
    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;

    // -- getters --
    public Long getId() { return id; }
    public Long getBankId() { return bankId; }
    public String getQuestionType() { return questionType; }
    public Integer getDifficulty() { return difficulty; }
    public String getContent() { return content; }
    public String getOptions() { return options; }
    public String getCorrectAnswer() { return correctAnswer; }
    public String getAnswerTemplate() { return answerTemplate; }
    public String getExplanation() { return explanation; }
    public String getTags() { return tags; }
    public BigDecimal getScore() { return score; }
    public Integer getSortOrder() { return sortOrder; }
    public Integer getStatus() { return status; }
    public Long getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setBankId(Long bankId) { this.bankId = bankId; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }
    public void setContent(String content) { this.content = content; }
    public void setOptions(String options) { this.options = options; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
    public void setAnswerTemplate(String answerTemplate) { this.answerTemplate = answerTemplate; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public void setTags(String tags) { this.tags = tags; }
    public void setScore(BigDecimal score) { this.score = score; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public void setStatus(Integer status) { this.status = status; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
