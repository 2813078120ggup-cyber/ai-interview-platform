package com.tyut.aiinterview.ai;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.domain.AiTask;
import com.tyut.aiinterview.domain.Evaluation;
import com.tyut.aiinterview.domain.Interview;
import com.tyut.aiinterview.domain.InterviewAnswer;
import com.tyut.aiinterview.domain.InterviewQuestion;
import com.tyut.aiinterview.domain.Question;
import com.tyut.aiinterview.domain.Report;
import com.tyut.aiinterview.mapper.AiTaskMapper;
import com.tyut.aiinterview.mapper.EvaluationMapper;
import com.tyut.aiinterview.mapper.InterviewAnswerMapper;
import com.tyut.aiinterview.mapper.InterviewMapper;
import com.tyut.aiinterview.mapper.InterviewQuestionMapper;
import com.tyut.aiinterview.mapper.QuestionMapper;
import com.tyut.aiinterview.mapper.ReportMapper;
import com.tyut.aiinterview.security.CurrentUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiTaskService {
    public static final String FOLLOW_UP = "FOLLOW_UP";
    public static final String OPENING = "OPENING";
    public static final String AUTO_EVALUATION = "AUTO_EVALUATION";

    private final AiTaskMapper taskMapper;
    private final InterviewMapper interviewMapper;
    private final InterviewQuestionMapper interviewQuestionMapper;
    private final InterviewAnswerMapper answerMapper;
    private final QuestionMapper questionMapper;
    private final EvaluationMapper evaluationMapper;
    private final ReportMapper reportMapper;
    private final DeepSeekGateway deepSeekGateway;
    private final ObjectMapper objectMapper;
    private final CurrentUser currentUser;

    public AiTaskService(AiTaskMapper taskMapper, InterviewMapper interviewMapper, InterviewQuestionMapper interviewQuestionMapper,
                         InterviewAnswerMapper answerMapper, QuestionMapper questionMapper, EvaluationMapper evaluationMapper,
                         ReportMapper reportMapper, DeepSeekGateway deepSeekGateway, ObjectMapper objectMapper, CurrentUser currentUser) {
        this.taskMapper = taskMapper;
        this.interviewMapper = interviewMapper;
        this.interviewQuestionMapper = interviewQuestionMapper;
        this.answerMapper = answerMapper;
        this.questionMapper = questionMapper;
        this.evaluationMapper = evaluationMapper;
        this.reportMapper = reportMapper;
        this.deepSeekGateway = deepSeekGateway;
        this.objectMapper = objectMapper;
        this.currentUser = currentUser;
    }

    @Transactional
    public AiTask requestFollowUp(Long interviewId, String answer, String question) {
        Interview interview = requireInterview(interviewId);
        requireParticipant(interview);
        if (interview.getStatus() != Interview.IN_PROGRESS) throw BusinessException.badRequest("仅进行中的面试可生成追问");
        return enqueue(interviewId, null, FOLLOW_UP, null, json("answer", answer, "question", question));
    }

    @Transactional
    public AiTask requestOpening(Long interviewId) {
        Interview interview = requireInterview(interviewId);
        requireCandidate(interview);
        if (interview.getStatus() != Interview.IN_PROGRESS) throw BusinessException.badRequest("仅进行中的面试可生成 AI 开场问题");
        InterviewQuestion first = interviewQuestionMapper.selectOne(new LambdaQueryWrapper<InterviewQuestion>()
                .eq(InterviewQuestion::getInterviewId, interviewId).orderByAsc(InterviewQuestion::getSequenceNo).last("LIMIT 1"));
        if (first == null) throw BusinessException.badRequest("本场面试尚未配置题目");
        String question = questionContent(first);
        if (question.isBlank()) throw new IllegalStateException("面试首题快照缺少内容");
        return enqueue(interviewId, null, OPENING, "opening:" + interviewId, json("question", question));
    }

    /** Called only after the interview status has been atomically changed to completed. */
    @Transactional
    public AiTask enqueueAutomaticEvaluation(Interview interview) {
        if (interview.getStatus() != Interview.COMPLETED) {
            throw new IllegalArgumentException("仅已结束面试可创建自动评分任务");
        }
        return enqueue(interview.getId(), null, AUTO_EVALUATION, "evaluation:" + interview.getId(),
                json("interviewId", interview.getId()));
    }

    public AiTask get(Long id) {
        AiTask task = taskMapper.selectById(id);
        if (task == null) throw BusinessException.notFound("AI 任务不存在");
        if (!(currentUser.id().equals(task.getCreatedBy()) || currentUser.hasRole("ADMIN"))) throw BusinessException.forbidden("无权查看 AI 任务");
        return task;
    }

    @Scheduled(fixedDelayString = "${app.ai-task.poll-interval-ms:3000}")
    public void processPendingTasks() {
        List<AiTask> tasks = taskMapper.selectList(new LambdaQueryWrapper<AiTask>().eq(AiTask::getStatus, "PENDING")
                .le(AiTask::getScheduledAt, LocalDateTime.now()).orderByAsc(AiTask::getId).last("LIMIT 5"));
        for (AiTask task : tasks) process(task.getId());
    }

    @Transactional
    public void process(Long id) {
        AiTask task = taskMapper.selectById(id);
        if (task == null || !"PENDING".equals(task.getStatus())) return;
        task.setStatus("RUNNING");
        task.setAttempts(task.getAttempts() + 1);
        task.setStartedAt(LocalDateTime.now());
        if (taskMapper.update(task, new LambdaQueryWrapper<AiTask>().eq(AiTask::getId, id).eq(AiTask::getStatus, "PENDING")) == 0) return;
        try {
            String output = switch (task.getTaskType()) {
                case FOLLOW_UP -> followUp(task);
                case OPENING -> opening(task);
                case AUTO_EVALUATION -> evaluateInterview(task);
                default -> throw new IllegalArgumentException("不支持的 AI 任务类型：" + task.getTaskType());
            };
            task.setStatus("SUCCESS");
            task.setOutputPayload(output);
            task.setFinishedAt(LocalDateTime.now());
            task.setErrorMessage(null);
            taskMapper.updateById(task);
        } catch (RuntimeException exception) {
            task.setStatus(task.getAttempts() < task.getMaxAttempts() && retryable(exception) ? "PENDING" : "FAILED");
            task.setScheduledAt(LocalDateTime.now().plusSeconds(30));
            task.setErrorMessage(truncate(exception.getMessage()));
            if ("FAILED".equals(task.getStatus())) task.setFinishedAt(LocalDateTime.now());
            taskMapper.updateById(task);
        }
    }

    private String followUp(AiTask task) {
        JsonNode input = tree(task.getInputPayload());
        String question = deepSeekGateway.followUp(input.path("question").asText(), input.path("answer").asText());
        return json("followUp", question);
    }

    private String opening(AiTask task) {
        String question = deepSeekGateway.openingQuestion(tree(task.getInputPayload()).path("question").asText());
        return json("question", question);
    }

    private String evaluateInterview(AiTask task) {
        Interview interview = requireInterview(task.getInterviewId());
        if (interview.getStatus() != Interview.COMPLETED) throw new IllegalStateException("面试尚未结束，不能自动评分");
        List<InterviewQuestion> interviewQuestions = interviewQuestionMapper.selectList(new LambdaQueryWrapper<InterviewQuestion>()
                .eq(InterviewQuestion::getInterviewId, interview.getId()).orderByAsc(InterviewQuestion::getSequenceNo));
        if (interviewQuestions.isEmpty()) throw new IllegalStateException("面试未配置题目，无法生成评测");

        List<EvaluationContext> contexts = new ArrayList<>();
        List<Evaluation> evaluations = new ArrayList<>();
        for (InterviewQuestion interviewQuestion : interviewQuestions) {
            Question sourceQuestion = interviewQuestion.getQuestionId() == null ? null : questionMapper.selectById(interviewQuestion.getQuestionId());
            InterviewAnswer answer = answerMapper.selectOne(new LambdaQueryWrapper<InterviewAnswer>()
                    .eq(InterviewAnswer::getInterviewQuestionId, interviewQuestion.getId()));
            String question = questionContent(interviewQuestion);
            String reference = sourceQuestion == null ? "" : joinReference(sourceQuestion);
            String candidateAnswer = answer == null ? "" : firstNonBlank(answer.getAnswerContent(), answer.getTranscript(), answer.getAnswerData());
            JsonNode result = deepSeekGateway.evaluateAnswer(question, reference, candidateAnswer);

            Evaluation evaluation = upsertAiEvaluation(interviewQuestion.getId(), result);
            evaluations.add(evaluation);
            contexts.add(new EvaluationContext(interviewQuestion.getSequenceNo(), question, candidateAnswer,
                    evaluation.getProfessionalScore(), evaluation.getExpressionScore(), evaluation.getLogicScore(),
                    evaluation.getAdaptabilityScore(), evaluation.getOverallScore(), evaluation.getComment()));
        }

        JsonNode narrative = deepSeekGateway.generateReport(write(contexts));
        Report report = upsertReport(interview, task, evaluations, narrative);
        return json("reportId", report.getId(), "evaluationCount", evaluations.size());
    }

    private Evaluation upsertAiEvaluation(Long interviewQuestionId, JsonNode result) {
        Evaluation evaluation = evaluationMapper.selectOne(new LambdaQueryWrapper<Evaluation>()
                .eq(Evaluation::getInterviewQuestionId, interviewQuestionId).eq(Evaluation::getSource, "ai").last("LIMIT 1"));
        if (evaluation == null) {
            evaluation = new Evaluation();
            evaluation.setInterviewQuestionId(interviewQuestionId);
            evaluation.setSource("ai");
            evaluation.setEvaluatorId(null);
        }
        evaluation.setProfessionalScore(score(result, "professionalScore"));
        evaluation.setExpressionScore(score(result, "expressionScore"));
        evaluation.setLogicScore(score(result, "logicScore"));
        evaluation.setAdaptabilityScore(score(result, "adaptabilityScore"));
        evaluation.setOverallScore(score(result, "overallScore"));
        evaluation.setComment(requiredText(result, "comment", 2000));
        evaluation.setStatus(1);
        evaluation.setConfirmedBy(null);
        if (evaluation.getId() == null) evaluationMapper.insert(evaluation); else evaluationMapper.updateById(evaluation);
        return evaluation;
    }

    private Report upsertReport(Interview interview, AiTask task, List<Evaluation> evaluations, JsonNode narrative) {
        Report report = reportMapper.selectOne(new LambdaQueryWrapper<Report>().eq(Report::getInterviewId, interview.getId()));
        if (report == null) {
            report = new Report();
            report.setInterviewId(interview.getId());
        }
        report.setProfessionalScore(average(evaluations, Evaluation::getProfessionalScore));
        report.setExpressionScore(average(evaluations, Evaluation::getExpressionScore));
        report.setLogicScore(average(evaluations, Evaluation::getLogicScore));
        report.setAdaptabilityScore(average(evaluations, Evaluation::getAdaptabilityScore));
        report.setTotalScore(average(evaluations, Evaluation::getOverallScore));
        report.setSummary(requiredText(narrative, "summary", 3000));
        report.setStrengths(requiredText(narrative, "strengths", 3000));
        report.setWeaknesses(requiredText(narrative, "weaknesses", 3000));
        report.setImprovementSuggestions(requiredText(narrative, "improvementSuggestions", 3000));
        report.setGenerationMethod("ai");
        report.setGeneratedBy(task.getCreatedBy());
        report.setStatus(1);
        report.setPublishedAt(LocalDateTime.now());
        if (report.getId() == null) reportMapper.insert(report); else reportMapper.updateById(report);
        return report;
    }

    private AiTask enqueue(Long interviewId, Long answerId, String type, String dedupeKey, String payload) {
        if (dedupeKey != null) {
            AiTask existing = taskMapper.selectOne(new LambdaQueryWrapper<AiTask>().eq(AiTask::getDedupeKey, dedupeKey));
            if (existing != null) return existing;
        }
        AiTask task = new AiTask();
        task.setInterviewId(interviewId);
        task.setAnswerId(answerId);
        task.setTaskType(type);
        task.setDedupeKey(dedupeKey);
        task.setStatus("PENDING");
        task.setAttempts(0);
        task.setMaxAttempts(3);
        task.setScheduledAt(LocalDateTime.now());
        task.setInputPayload(payload);
        task.setCreatedBy(currentUser.id());
        taskMapper.insert(task);
        return task;
    }

    private String questionContent(InterviewQuestion question) {
        String content = tree(question.getQuestionSnapshot()).path("content").asText();
        return content == null ? "" : content.trim();
    }

    private String joinReference(Question question) {
        return String.join("\n", List.of("参考答案：" + nullToEmpty(question.getCorrectAnswer()),
                "答题要点：" + nullToEmpty(question.getAnswerTemplate()), "解析：" + nullToEmpty(question.getExplanation()))).trim();
    }

    private BigDecimal score(JsonNode result, String field) {
        JsonNode value = result.get(field);
        if (value == null || !value.isNumber()) throw new IllegalStateException("DeepSeek 评分结果缺少数值字段：" + field);
        BigDecimal score = value.decimalValue().setScale(2, RoundingMode.HALF_UP);
        if (score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalStateException("DeepSeek 评分超出 0-100 范围：" + field);
        }
        return score;
    }

    private String requiredText(JsonNode result, String field, int maxLength) {
        String value = result.path(field).asText().trim();
        if (value.isBlank()) throw new IllegalStateException("DeepSeek 结果缺少文本字段：" + field);
        return value.substring(0, Math.min(maxLength, value.length()));
    }

    private BigDecimal average(List<Evaluation> records, Function<Evaluation, BigDecimal> getter) {
        return records.stream().map(getter).reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(records.size()), 2, RoundingMode.HALF_UP);
    }

    private Interview requireInterview(Long id) {
        Interview item = interviewMapper.selectById(id);
        if (item == null) throw BusinessException.notFound("面试不存在");
        return item;
    }

    private void requireCandidate(Interview item) {
        if (!currentUser.id().equals(item.getCandidateId())) throw BusinessException.forbidden("仅候选人可生成本场 AI 开场问题");
    }

    private void requireParticipant(Interview item) {
        Long id = currentUser.id();
        if (!(id.equals(item.getCandidateId()) || id.equals(item.getInterviewerId()) || currentUser.hasRole("ADMIN"))) {
            throw BusinessException.forbidden("无权操作该面试");
        }
    }

    private JsonNode tree(String value) {
        try {
            return objectMapper.readTree(value == null ? "{}" : value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("AI 任务参数损坏", exception);
        }
    }

    private String json(Object... values) {
        try {
            var node = objectMapper.createObjectNode();
            for (int i = 0; i < values.length; i += 2) node.put(String.valueOf(values[i]), String.valueOf(values[i + 1]));
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("无法序列化 AI 评测上下文", exception);
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return "";
    }

    private String nullToEmpty(String value) { return value == null ? "" : value; }
    private boolean retryable(RuntimeException exception) {
        String message = exception.getMessage() == null ? "" : exception.getMessage();
        return !(message.contains("未配置 DEEPSEEK_API_KEY") || message.contains("HTTP 401") || message.contains("HTTP 403"));
    }
    private String truncate(String value) { return value == null ? "未知错误" : value.substring(0, Math.min(1000, value.length())); }

    private record EvaluationContext(Integer sequenceNo, String question, String answer, BigDecimal professionalScore,
                                     BigDecimal expressionScore, BigDecimal logicScore, BigDecimal adaptabilityScore,
                                     BigDecimal overallScore, String comment) {}
}
