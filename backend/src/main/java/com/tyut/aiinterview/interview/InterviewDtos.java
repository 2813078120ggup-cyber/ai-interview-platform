package com.tyut.aiinterview.interview;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class InterviewDtos {
    private InterviewDtos() {
    }

    public record CreateRequest(@NotBlank String title, Long candidateId, @NotNull Long interviewerId,
                                @NotNull LocalDateTime scheduledAt, Integer duration, @NotBlank String type,
                                String meetingUrl, String remark, List<Long> questionIds, Long bankId,
                                Integer questionCount) {
    }

    public record InterviewView(Long id, String title, Long candidateId, Long interviewerId,
                                LocalDateTime scheduledAt, Integer duration, LocalDateTime startedAt,
                                LocalDateTime endedAt, Integer status, String type, String meetingUrl,
                                String remark) {
    }

    public record QuestionInInterviewView(Long id, Long questionId, Integer sequenceNo, BigDecimal maxScore,
                                          String questionSnapshot) {
    }

    public record AnswerRequest(String answerContent, String answerData, String audioUrl, Integer durationSeconds) {
    }

    public record PracticeBankView(Long id, String name, String description, Long questionCount) {
    }
}
