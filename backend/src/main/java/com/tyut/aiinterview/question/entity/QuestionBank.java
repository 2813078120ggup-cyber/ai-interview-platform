package com.tyut.aiinterview.question.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("question_bank")
public class QuestionBank {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String bankCode;
    private String name;
    private String description;
    private Integer visibility;
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
    public String getBankCode() { return bankCode; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Integer getVisibility() { return visibility; }
    public Integer getStatus() { return status; }
    public Long getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setBankCode(String bankCode) { this.bankCode = bankCode; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setVisibility(Integer visibility) { this.visibility = visibility; }
    public void setStatus(Integer status) { this.status = status; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
