package com.tyut.aiinterview.report.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.evaluation.entity.Evaluation;
import com.tyut.aiinterview.evaluation.mapper.EvaluationMapper;
import com.tyut.aiinterview.interview.entity.Interview;
import com.tyut.aiinterview.interview.entity.InterviewQuestion;
import com.tyut.aiinterview.interview.mapper.InterviewMapper;
import com.tyut.aiinterview.interview.mapper.InterviewQuestionMapper;
import com.tyut.aiinterview.report.dto.ReportVO;
import com.tyut.aiinterview.report.entity.Report;
import com.tyut.aiinterview.report.mapper.ReportMapper;
import com.tyut.aiinterview.report.service.ReportService;
import com.tyut.aiinterview.user.entity.User;
import com.tyut.aiinterview.user.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);

    private final ReportMapper reportMapper;
    private final InterviewMapper interviewMapper;
    private final InterviewQuestionMapper interviewQuestionMapper;
    private final EvaluationMapper evaluationMapper;
    private final UserMapper userMapper;

    public ReportServiceImpl(ReportMapper reportMapper, InterviewMapper interviewMapper,
                              InterviewQuestionMapper interviewQuestionMapper,
                              EvaluationMapper evaluationMapper, UserMapper userMapper) {
        this.reportMapper = reportMapper;
        this.interviewMapper = interviewMapper;
        this.interviewQuestionMapper = interviewQuestionMapper;
        this.evaluationMapper = evaluationMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public ReportVO generateReport(Long interviewId, Long operatorId) {
        Interview interview = interviewMapper.selectById(interviewId);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }
        if (interview.getStatus() != 2) {
            throw new BusinessException("只有已结束的面试才能生成报告");
        }

        // Check if report already exists (US-10: one report per interview)
        Report existing = reportMapper.selectOne(new LambdaQueryWrapper<Report>()
                .eq(Report::getInterviewId, interviewId));
        if (existing != null) {
            return buildVO(existing);
        }

        // Aggregate evaluation scores
        List<InterviewQuestion> questions = interviewQuestionMapper.selectList(
                new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getInterviewId, interviewId));

        BigDecimal totalProfessional = BigDecimal.ZERO;
        BigDecimal totalExpression = BigDecimal.ZERO;
        BigDecimal totalLogic = BigDecimal.ZERO;
        BigDecimal totalAdaptability = BigDecimal.ZERO;
        BigDecimal totalOverall = BigDecimal.ZERO;
        int evalCount = 0;

        for (InterviewQuestion iq : questions) {
            // Prefer human evaluation, fallback to AI
            Evaluation eval = evaluationMapper.selectOne(new LambdaQueryWrapper<Evaluation>()
                    .eq(Evaluation::getInterviewQuestionId, iq.getId())
                    .eq(Evaluation::getSource, "human")
                    .orderByDesc(Evaluation::getCreatedAt)
                    .last("LIMIT 1"));

            if (eval == null) {
                eval = evaluationMapper.selectOne(new LambdaQueryWrapper<Evaluation>()
                        .eq(Evaluation::getInterviewQuestionId, iq.getId())
                        .eq(Evaluation::getSource, "ai")
                        .orderByDesc(Evaluation::getCreatedAt)
                        .last("LIMIT 1"));
            }

            if (eval != null) {
                totalProfessional = totalProfessional.add(eval.getProfessionalScore());
                totalExpression = totalExpression.add(eval.getExpressionScore());
                totalLogic = totalLogic.add(eval.getLogicScore());
                totalAdaptability = totalAdaptability.add(eval.getAdaptabilityScore());
                totalOverall = totalOverall.add(eval.getOverallScore());
                evalCount++;
            }
        }

        BigDecimal avgProfessional = evalCount > 0 ? avg(totalProfessional, evalCount) : null;
        BigDecimal avgExpression = evalCount > 0 ? avg(totalExpression, evalCount) : null;
        BigDecimal avgLogic = evalCount > 0 ? avg(totalLogic, evalCount) : null;
        BigDecimal avgAdaptability = evalCount > 0 ? avg(totalAdaptability, evalCount) : null;
        BigDecimal avgOverall = evalCount > 0 ? avg(totalOverall, evalCount) : BigDecimal.ZERO;

        Report report = new Report();
        report.setInterviewId(interviewId);
        report.setTotalScore(avgOverall);
        report.setProfessionalScore(avgProfessional);
        report.setExpressionScore(avgExpression);
        report.setLogicScore(avgLogic);
        report.setAdaptabilityScore(avgAdaptability);
        report.setSummary("面试综合评估报告");
        report.setStrengths("待面试官填写");
        report.setWeaknesses("待面试官填写");
        report.setImprovementSuggestions("建议根据各维度得分进行针对性提升");
        report.setGenerationMethod("ai");
        report.setGeneratedBy(operatorId);
        report.setPublished(0);
        report.setGeneratedAt(LocalDateTime.now());
        reportMapper.insert(report);

        log.info("Report generated: interviewId={}, totalScore={}", interviewId, avgOverall);
        return buildVO(report);
    }

    @Override
    public ReportVO publishReport(Long interviewId, Long operatorId) {
        Report report = reportMapper.selectOne(new LambdaQueryWrapper<Report>()
                .eq(Report::getInterviewId, interviewId));
        if (report == null) {
            throw new BusinessException(404, "报告不存在，请先生成报告");
        }
        report.setPublished(1);
        reportMapper.updateById(report);

        log.info("Report published: interviewId={}, operator={}", interviewId, operatorId);
        return buildVO(report);
    }

    @Override
    public ReportVO getReportByInterviewId(Long interviewId) {
        Report report = reportMapper.selectOne(new LambdaQueryWrapper<Report>()
                .eq(Report::getInterviewId, interviewId));
        if (report == null) {
            throw new BusinessException(404, "报告不存在");
        }
        return buildVO(report);
    }

    @Override
    public ReportVO getReportById(Long id) {
        Report report = reportMapper.selectById(id);
        if (report == null) {
            throw new BusinessException(404, "报告不存在");
        }
        return buildVO(report);
    }

    @Override
    public List<ReportVO> listReports(String role, Long userId) {
        List<Report> reports;

        if ("CANDIDATE".equals(role)) {
            // Candidates only see published reports for their own interviews (US-10, role conflict)
            List<Interview> interviews = interviewMapper.selectList(new LambdaQueryWrapper<Interview>()
                    .eq(Interview::getCandidateId, userId));
            List<Long> interviewIds = interviews.stream().map(Interview::getId).toList();

            if (interviewIds.isEmpty()) {
                return List.of();
            }
            reports = reportMapper.selectList(new LambdaQueryWrapper<Report>()
                    .in(Report::getInterviewId, interviewIds)
                    .eq(Report::getPublished, 1)
                    .orderByDesc(Report::getGeneratedAt));
        } else {
            // HR/Admin/Interviewer see all reports
            reports = reportMapper.selectList(new LambdaQueryWrapper<Report>()
                    .orderByDesc(Report::getGeneratedAt));
        }

        return reports.stream().map(this::buildVO).toList();
    }

    private ReportVO buildVO(Report report) {
        ReportVO vo = new ReportVO();
        vo.setId(report.getId());
        vo.setInterviewId(report.getInterviewId());
        vo.setTotalScore(report.getTotalScore());
        vo.setProfessionalScore(report.getProfessionalScore());
        vo.setExpressionScore(report.getExpressionScore());
        vo.setLogicScore(report.getLogicScore());
        vo.setAdaptabilityScore(report.getAdaptabilityScore());
        vo.setSummary(report.getSummary());
        vo.setStrengths(report.getStrengths());
        vo.setWeaknesses(report.getWeaknesses());
        vo.setImprovementSuggestions(report.getImprovementSuggestions());
        vo.setGenerationMethod(report.getGenerationMethod());
        vo.setPublished(report.getPublished());
        vo.setPdfUrl(report.getPdfUrl());
        vo.setGeneratedAt(report.getGeneratedAt());

        Interview interview = interviewMapper.selectById(report.getInterviewId());
        if (interview != null) {
            vo.setInterviewTitle(interview.getTitle());
            User candidate = userMapper.selectById(interview.getCandidateId());
            if (candidate != null) {
                vo.setCandidateName(candidate.getRealName());
            }
        }
        return vo;
    }

    private BigDecimal avg(BigDecimal sum, int count) {
        return sum.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }
}
