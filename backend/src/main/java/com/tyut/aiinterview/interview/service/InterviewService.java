package com.tyut.aiinterview.interview.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.interview.dto.*;
import com.tyut.aiinterview.interview.entity.InterviewAnswer;
import com.tyut.aiinterview.interview.entity.InterviewQuestion;

import java.util.List;

public interface InterviewService {

    // HR operations
    InterviewVO createInterview(CreateInterviewRequest request, Long userId);

    InterviewVO updateInterview(Long id, UpdateInterviewRequest request);

    void cancelInterview(Long id, String reason, Long operatorId);

    void markCandidateAbsent(Long id, Long operatorId);

    // Interview operations
    List<InterviewQuestion> startInterview(Long id, Long operatorId);

    void endInterview(Long id, Long operatorId);

    // Answer operations
    InterviewAnswer submitAnswer(Long interviewQuestionId, SubmitAnswerRequest request, Long candidateId);

    // Query
    Page<InterviewVO> listInterviews(Long userId, String role, Integer status, Integer page, Integer size);

    InterviewVO getInterviewDetail(Long id);

    List<InterviewQuestion> getInterviewQuestions(Long interviewId, boolean includeAnswer);

    List<InterviewAnswer> getInterviewAnswers(Long interviewId);
}
