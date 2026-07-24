package com.tyut.aiinterview.evaluation.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.evaluation.dto.EvaluationRequest;
import com.tyut.aiinterview.evaluation.dto.EvaluationVO;
import com.tyut.aiinterview.evaluation.entity.Evaluation;
import com.tyut.aiinterview.evaluation.mapper.EvaluationMapper;
import com.tyut.aiinterview.evaluation.service.EvaluationService;
import com.tyut.aiinterview.interview.entity.Interview;
import com.tyut.aiinterview.interview.entity.InterviewQuestion;
import com.tyut.aiinterview.interview.mapper.InterviewMapper;
import com.tyut.aiinterview.interview.mapper.InterviewQuestionMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class EvaluationServiceImpl implements EvaluationService {

    private static final Logger log = LoggerFactory.getLogger(EvaluationServiceImpl.class);

    private final EvaluationMapper evaluationMapper;
    private final InterviewQuestionMapper interviewQuestionMapper;
    private final InterviewMapper interviewMapper;

    public EvaluationServiceImpl(EvaluationMapper evaluationMapper,
                                  InterviewQuestionMapper interviewQuestionMapper,
                                  InterviewMapper interviewMapper) {
        this.evaluationMapper = evaluationMapper;
        this.interviewQuestionMapper = interviewQuestionMapper;
        this.interviewMapper = interviewMapper;
    }

    @Override
    public EvaluationVO submitHumanEvaluation(Long interviewQuestionId, EvaluationRequest request, Long evaluatorId) {
        InterviewQuestion iq = interviewQuestionMapper.selectById(interviewQuestionId);
        if (iq == null) {
            throw new BusinessException(404, "面试题目不存在");
        }

        Interview interview = interviewMapper.selectById(iq.getInterviewId());
        if (interview == null || interview.getStatus() != 2) {
            throw new BusinessException("只有已结束的面试才能提交评测");
        }

        Evaluation eval = new Evaluation();
        eval.setInterviewQuestionId(interviewQuestionId);
        eval.setEvaluatorId(evaluatorId);
        eval.setSource("human");
        fillScores(eval, request);
        eval.setStatus(1); // confirmed by default for human
        evaluationMapper.insert(eval);

        log.info("Human evaluation submitted: iqId={}, evaluator={}", interviewQuestionId, evaluatorId);
        return EvaluationVO.from(eval);
    }

    @Override
    public EvaluationVO submitAiEvaluation(Long interviewQuestionId, EvaluationRequest request) {
        InterviewQuestion iq = interviewQuestionMapper.selectById(interviewQuestionId);
        if (iq == null) {
            throw new BusinessException(404, "面试题目不存在");
        }

        Evaluation eval = new Evaluation();
        eval.setInterviewQuestionId(interviewQuestionId);
        eval.setEvaluatorId(null); // AI has no human evaluator
        eval.setSource("ai");
        fillScores(eval, request);
        eval.setStatus(0); // pending confirmation for AI
        evaluationMapper.insert(eval);

        log.info("AI evaluation submitted: iqId={}", interviewQuestionId);
        return EvaluationVO.from(eval);
    }

    @Override
    public List<EvaluationVO> listEvaluations(Long interviewId) {
        List<InterviewQuestion> questions = interviewQuestionMapper.selectList(
                new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getInterviewId, interviewId));

        List<EvaluationVO> result = new ArrayList<>();
        for (InterviewQuestion iq : questions) {
            List<Evaluation> evals = evaluationMapper.selectList(
                    new LambdaQueryWrapper<Evaluation>()
                            .eq(Evaluation::getInterviewQuestionId, iq.getId()));
            for (Evaluation e : evals) {
                result.add(EvaluationVO.from(e));
            }
        }
        return result;
    }

    @Override
    public void confirmEvaluation(Long evaluationId, Long confirmerId) {
        Evaluation eval = evaluationMapper.selectById(evaluationId);
        if (eval == null) {
            throw new BusinessException(404, "评测记录不存在");
        }
        eval.setStatus(1); // confirmed
        eval.setConfirmedBy(confirmerId);
        eval.setConfirmedAt(LocalDateTime.now());
        evaluationMapper.updateById(eval);

        log.info("Evaluation confirmed: id={}, confirmer={}", evaluationId, confirmerId);
    }

    private void fillScores(Evaluation eval, EvaluationRequest request) {
        eval.setProfessionalScore(request.getProfessionalScore());
        eval.setExpressionScore(request.getExpressionScore());
        eval.setLogicScore(request.getLogicScore());
        eval.setAdaptabilityScore(request.getAdaptabilityScore());
        eval.setOverallScore(request.getOverallScore());
        eval.setComment(request.getComment());
    }
}
