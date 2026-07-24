package com.tyut.aiinterview.evaluation.service;

import com.tyut.aiinterview.evaluation.dto.EvaluationRequest;
import com.tyut.aiinterview.evaluation.dto.EvaluationVO;

import java.util.List;

public interface EvaluationService {

    EvaluationVO submitHumanEvaluation(Long interviewQuestionId, EvaluationRequest request, Long evaluatorId);

    EvaluationVO submitAiEvaluation(Long interviewQuestionId, EvaluationRequest request);

    List<EvaluationVO> listEvaluations(Long interviewId);

    void confirmEvaluation(Long evaluationId, Long confirmerId);
}
