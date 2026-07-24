package com.tyut.aiinterview.question;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class QuestionDtos {
    private QuestionDtos() {
    }

    public record PracticeBankSummary(Long id, String name, String description, Long questionCount) {
    }

    public record BankView(Long id, String bankCode, String name, String description, Integer visibility,
                           Integer status, Long questionCount) {
    }

    public record QuestionView(Long id, Long bankId, String questionType, Integer difficulty, String content,
                               String options, String answerTemplate, String explanation, String tags,
                               BigDecimal score, Integer sortOrder, Integer status) {
    }

    public record BankRequest(@NotBlank String bankCode, @NotBlank String name, String description,
                              Integer visibility, Integer status) {
    }

    public record QuestionRequest(@NotNull Long bankId, @NotBlank String questionType, Integer difficulty,
                                  @NotBlank String content, String options, String correctAnswer,
                                  String answerTemplate, String explanation, List<String> tags,
                                  BigDecimal score, Integer sortOrder, Integer status) {
    }

    public record GenerateRequest(@NotNull Long bankId, @NotBlank String role, Integer difficulty,
                                  Integer count, String focus) {
    }
}
