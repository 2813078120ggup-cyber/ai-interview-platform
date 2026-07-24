package com.tyut.aiinterview.evaluation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.tyut.aiinterview.evaluation.dto.EvaluationRequest;
import com.tyut.aiinterview.evaluation.dto.EvaluationResponse;
import com.tyut.aiinterview.evaluation.entity.Evaluation;

import java.util.List;

public interface EvaluationService extends IService<Evaluation> {

    EvaluationResponse createEvaluation(EvaluationRequest request);

    EvaluationResponse getEvaluationById(Long id);

    List<EvaluationResponse> getEvaluationsByInterviewQuestionId(Long interviewQuestionId);

    List<EvaluationResponse> getEvaluationsByInterviewId(Long interviewId);

    EvaluationResponse updateEvaluation(Long id, EvaluationRequest request);

    EvaluationResponse confirmEvaluation(Long id, Long confirmedBy);

    void deleteEvaluation(Long id);

    EvaluationResponse createAiEvaluation(Long interviewQuestionId, String question, String answer);
}
