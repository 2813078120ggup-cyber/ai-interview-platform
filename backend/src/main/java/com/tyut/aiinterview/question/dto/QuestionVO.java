package com.tyut.aiinterview.question.dto;

import com.tyut.aiinterview.question.entity.Question;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class QuestionVO {

    private Long id;
    private Long bankId;
    private String bankName;
    private String questionType;
    private Integer difficulty;
    private String content;
    private String options;
    private String answerTemplate;
    private String explanation;
    private String tags;
    private BigDecimal score;
    private Integer sortOrder;
    private Integer status;
    private Long createdBy;
    private LocalDateTime createdAt;

    public static QuestionVO from(Question q) {
        QuestionVO vo = new QuestionVO();
        vo.id = q.getId();
        vo.bankId = q.getBankId();
        vo.questionType = q.getQuestionType();
        vo.difficulty = q.getDifficulty();
        vo.content = q.getContent();
        vo.options = q.getOptions();
        vo.answerTemplate = q.getAnswerTemplate();
        vo.explanation = q.getExplanation();
        vo.tags = q.getTags();
        vo.score = q.getScore();
        vo.sortOrder = q.getSortOrder();
        vo.status = q.getStatus();
        vo.createdBy = q.getCreatedBy();
        vo.createdAt = q.getCreatedAt();
        return vo;
    }

    // -- getters and setters --
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBankId() { return bankId; }
    public void setBankId(Long bankId) { this.bankId = bankId; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }
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
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
