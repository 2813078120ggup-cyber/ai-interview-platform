package com.tyut.aiinterview.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QuestionBankRequest {

    @NotBlank(message = "题库编码不能为空")
    private String bankCode;

    @NotBlank(message = "题库名称不能为空")
    private String name;

    private String description;

    @NotNull(message = "可见范围不能为空")
    private Integer visibility;

    // -- getters and setters --
    public String getBankCode() { return bankCode; }
    public void setBankCode(String bankCode) { this.bankCode = bankCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getVisibility() { return visibility; }
    public void setVisibility(Integer visibility) { this.visibility = visibility; }
}
