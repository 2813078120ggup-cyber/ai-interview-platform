package com.gc.aiinterview.report;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gc.aiinterview.common.BusinessException;
import com.gc.aiinterview.common.PageResult;
import com.gc.aiinterview.domain.Evaluation;
import com.gc.aiinterview.domain.Interview;
import com.gc.aiinterview.domain.InterviewQuestion;
import com.gc.aiinterview.domain.Report;
import com.gc.aiinterview.domain.UserAccount;
import com.gc.aiinterview.mapper.EvaluationMapper;
import com.gc.aiinterview.mapper.InterviewMapper;
import com.gc.aiinterview.mapper.InterviewQuestionMapper;
import com.gc.aiinterview.mapper.ReportMapper;
import com.gc.aiinterview.mapper.UserMapper;
import com.gc.aiinterview.security.CurrentUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Comparator;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {
    private final ReportMapper reportMapper; private final InterviewMapper interviewMapper; private final InterviewQuestionMapper questionMapper;
    private final EvaluationMapper evaluationMapper; private final UserMapper userMapper; private final CurrentUser currentUser;
    public ReportService(ReportMapper reportMapper, InterviewMapper interviewMapper, InterviewQuestionMapper questionMapper,
                         EvaluationMapper evaluationMapper, UserMapper userMapper, CurrentUser currentUser) {
        this.reportMapper = reportMapper; this.interviewMapper = interviewMapper; this.questionMapper = questionMapper;
        this.evaluationMapper = evaluationMapper; this.userMapper = userMapper; this.currentUser = currentUser;
    }
    @Transactional
    public Report generate(Long interviewId) {
        requireHr(); Interview interview = interviewMapper.selectById(interviewId);
        if (interview == null) throw BusinessException.notFound("面试不存在");
        if (interview.getStatus() != Interview.COMPLETED) throw BusinessException.badRequest("仅已结束面试可生成报告");
        List<Long> questionIds = questionMapper.selectList(new LambdaQueryWrapper<InterviewQuestion>().eq(InterviewQuestion::getInterviewId, interviewId)).stream().map(InterviewQuestion::getId).toList();
        List<Evaluation> evaluations = questionIds.isEmpty() ? List.of() : evaluationMapper.selectList(new LambdaQueryWrapper<Evaluation>().in(Evaluation::getInterviewQuestionId, questionIds));
        if (evaluations.isEmpty()) throw BusinessException.badRequest("暂无评测数据，无法生成报告");
        Report report = reportMapper.selectOne(new LambdaQueryWrapper<Report>().eq(Report::getInterviewId, interviewId));
        if (report == null) { report = new Report(); report.setInterviewId(interviewId); }
        report.setProfessionalScore(average(evaluations, Evaluation::getProfessionalScore)); report.setExpressionScore(average(evaluations, Evaluation::getExpressionScore));
        report.setLogicScore(average(evaluations, Evaluation::getLogicScore)); report.setAdaptabilityScore(average(evaluations, Evaluation::getAdaptabilityScore));
        report.setTotalScore(average(evaluations, Evaluation::getOverallScore)); report.setSummary("根据本次面试作答与评测数据生成的综合评估。");
        report.setStrengths("请结合各维度得分与评语进一步确认候选人优势。"); report.setWeaknesses("请结合各维度得分与评语进一步确认待提升项。");
        report.setImprovementSuggestions("建议围绕得分较低的能力维度进行针对性训练。"); report.setGenerationMethod("manual"); report.setGeneratedBy(currentUser.id());
        report.setStatus(0); report.setPublishedAt(null);
        if (report.getId() == null) reportMapper.insert(report); else reportMapper.updateById(report);
        return report;
    }
    public Report get(Long interviewId) {
        Interview interview = interviewMapper.selectById(interviewId);
        if (interview == null) throw BusinessException.notFound("面试不存在");
        Long id = currentUser.id();
        boolean manager = currentUser.hasRole("ADMIN");
        if (!(id.equals(interview.getCandidateId()) || id.equals(interview.getInterviewerId()) || manager)) throw BusinessException.forbidden("无权查看报告");
        Report report = reportMapper.selectOne(new LambdaQueryWrapper<Report>().eq(Report::getInterviewId, interviewId));
        if (report == null) throw BusinessException.notFound("报告尚未生成");
        if (id.equals(interview.getCandidateId()) && report.getStatus() != 1) throw BusinessException.forbidden("报告尚未发布");
        return report;
    }
    @Transactional
    public Report publish(Long interviewId) {
        requireHr();
        Report report = reportMapper.selectOne(new LambdaQueryWrapper<Report>().eq(Report::getInterviewId, interviewId));
        if (report == null) throw BusinessException.notFound("报告尚未生成");
        if (report.getStatus() == 1) return report;
        report.setStatus(1); report.setPublishedAt(LocalDateTime.now()); reportMapper.updateById(report);
        return report;
    }
    public PageResult<ReportDtos.ReportListItem> pageForAdmin(ReportDtos.ReportQuery query) {
        requireHr();
        long pageNo = query.pageNo() == null ? 1 : Math.max(1, query.pageNo());
        long pageSize = query.pageSize() == null ? 20 : Math.min(100, Math.max(1, query.pageSize()));
        Map<Long, Interview> interviews = interviewMapper.selectList(null).stream().collect(Collectors.toMap(Interview::getId, Function.identity()));
        Map<Long, UserAccount> candidates = userMapper.selectList(null).stream().collect(Collectors.toMap(UserAccount::getId, Function.identity()));
        String keyword = query.keyword() == null ? "" : query.keyword().trim().toLowerCase();
        List<ReportDtos.ReportListItem> all = reportMapper.selectList(new LambdaQueryWrapper<Report>().orderByDesc(Report::getPublishedAt).orderByDesc(Report::getId)).stream()
                .map(report -> toListItem(report, interviews.get(report.getInterviewId()), candidates))
                .filter(Objects::nonNull)
                .filter(item -> keyword.isBlank() || contains(item.interviewTitle(), keyword) || contains(item.candidateName(), keyword) || contains(item.candidateUsername(), keyword))
                .toList();
        int from = (int) Math.min((pageNo - 1) * pageSize, all.size());
        int to = (int) Math.min(from + pageSize, all.size());
        return PageResult.of(all.subList(from, to), all.size(), pageNo, pageSize);
    }
    public ReportDtos.CandidateAbilitySummary myAbilitySummary() {
        if (!currentUser.hasRole("CANDIDATE")) throw BusinessException.forbidden("仅候选人可查看能力仪表盘");
        Long candidateId = currentUser.id();
        Map<Long, Interview> interviews = interviewMapper.selectList(new LambdaQueryWrapper<Interview>().eq(Interview::getCandidateId, candidateId))
                .stream().collect(Collectors.toMap(Interview::getId, Function.identity()));
        List<ReportDtos.TrendPoint> trends = reportMapper.selectList(new LambdaQueryWrapper<Report>().eq(Report::getStatus, 1))
                .stream().map(report -> toTrendPoint(report, interviews.get(report.getInterviewId())))
                .filter(Objects::nonNull).sorted(Comparator.comparing(ReportDtos.TrendPoint::scheduledAt)).toList();
        ReportDtos.TrendPoint latest = trends.isEmpty() ? null : trends.get(trends.size() - 1);
        ReportDtos.TrendPoint previous = trends.size() < 2 ? null : trends.get(trends.size() - 2);
        return new ReportDtos.CandidateAbilitySummary(trends.size(), latest, previous, scoreChange(latest, previous), trends);
    }
    private ReportDtos.ReportListItem toListItem(Report report, Interview interview, Map<Long, UserAccount> candidates) {
        if (interview == null) return null;
        UserAccount candidate = candidates.get(interview.getCandidateId());
        return new ReportDtos.ReportListItem(report.getId(), report.getInterviewId(), interview.getTitle(), interview.getCandidateId(),
                candidate == null ? "候选人" : candidate.getRealName(), candidate == null ? "" : candidate.getUsername(), interview.getScheduledAt(),
                report.getTotalScore(), report.getProfessionalScore(), report.getExpressionScore(), report.getLogicScore(), report.getAdaptabilityScore(), report.getStatus(), report.getPublishedAt());
    }
    private ReportDtos.TrendPoint toTrendPoint(Report report, Interview interview) {
        if (interview == null) return null;
        return new ReportDtos.TrendPoint(interview.getId(), interview.getTitle(), interview.getScheduledAt(), report.getTotalScore(),
                report.getProfessionalScore(), report.getExpressionScore(), report.getLogicScore(), report.getAdaptabilityScore());
    }
    private ReportDtos.ScoreChange scoreChange(ReportDtos.TrendPoint latest, ReportDtos.TrendPoint previous) {
        if (latest == null || previous == null) return new ReportDtos.ScoreChange(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        return new ReportDtos.ScoreChange(diff(latest.totalScore(), previous.totalScore()), diff(latest.professionalScore(), previous.professionalScore()),
                diff(latest.expressionScore(), previous.expressionScore()), diff(latest.logicScore(), previous.logicScore()), diff(latest.adaptabilityScore(), previous.adaptabilityScore()));
    }
    private BigDecimal diff(BigDecimal left, BigDecimal right) { return left.subtract(right).setScale(2, RoundingMode.HALF_UP); }
    private boolean contains(String value, String keyword) { return value != null && value.toLowerCase().contains(keyword); }
    private BigDecimal average(List<Evaluation> records, Function<Evaluation, BigDecimal> getter) { return records.stream().map(getter).reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(records.size()), 2, RoundingMode.HALF_UP); }
    private void requireHr() { if (!currentUser.hasRole("ADMIN")) throw BusinessException.forbidden("仅管理员可生成报告"); }
}
