package com.tyut.aiinterview.interview;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.domain.Interview;
import com.tyut.aiinterview.domain.InterviewAnswer;
import com.tyut.aiinterview.domain.InterviewQuestion;
import com.tyut.aiinterview.domain.Question;
import com.tyut.aiinterview.domain.UserAccount;
import com.tyut.aiinterview.mapper.InterviewAnswerMapper;
import com.tyut.aiinterview.mapper.InterviewMapper;
import com.tyut.aiinterview.mapper.InterviewQuestionMapper;
import com.tyut.aiinterview.mapper.JobPositionMapper;
import com.tyut.aiinterview.mapper.QuestionBankMapper;
import com.tyut.aiinterview.mapper.QuestionMapper;
import com.tyut.aiinterview.mapper.UserMapper;
import com.tyut.aiinterview.mapper.UserRoleMapper;
import com.tyut.aiinterview.question.QuestionDtos;
import com.tyut.aiinterview.security.CurrentUser;
import com.tyut.aiinterview.user.SystemRoleService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InterviewService {
    private final InterviewMapper interviewMapper;
    private final InterviewQuestionMapper interviewQuestionMapper;
    private final InterviewAnswerMapper interviewAnswerMapper;
    private final QuestionMapper questionMapper;
    private final QuestionBankMapper questionBankMapper;
    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final SystemRoleService systemRoleService;
    private final JobPositionMapper jobPositionMapper;
    private final CurrentUser currentUser;
    private final AiEvaluationGateway aiEvaluationGateway;
    private final ObjectMapper objectMapper;
    private final int startWindowMinutes;

    public InterviewService(InterviewMapper interviewMapper, InterviewQuestionMapper interviewQuestionMapper,
                            InterviewAnswerMapper interviewAnswerMapper, QuestionMapper questionMapper,
                            QuestionBankMapper questionBankMapper, UserMapper userMapper,
                            UserRoleMapper userRoleMapper, SystemRoleService systemRoleService,
                            JobPositionMapper jobPositionMapper, CurrentUser currentUser,
                            AiEvaluationGateway aiEvaluationGateway, ObjectMapper objectMapper,
                            @Value("${interview.start-window-minutes:15}") int startWindowMinutes) {
        this.interviewMapper = interviewMapper;
        this.interviewQuestionMapper = interviewQuestionMapper;
        this.interviewAnswerMapper = interviewAnswerMapper;
        this.questionMapper = questionMapper;
        this.questionBankMapper = questionBankMapper;
        this.userMapper = userMapper;
        this.userRoleMapper = userRoleMapper;
        this.systemRoleService = systemRoleService;
        this.jobPositionMapper = jobPositionMapper;
        this.currentUser = currentUser;
        this.aiEvaluationGateway = aiEvaluationGateway;
        this.objectMapper = objectMapper;
        this.startWindowMinutes = startWindowMinutes;
    }

    @Transactional
    public InterviewDtos.InterviewView create(InterviewDtos.CreateRequest request) {
        Long candidateId = request.candidateId() == null ? request.interviewerId() : request.candidateId();
        requireActiveUser(candidateId, "候选人不存在或已禁用");
        validateCandidateRole(candidateId);

        Interview interview = new Interview();
        interview.setTitle(request.title());
        interview.setCandidateId(candidateId);
        interview.setInterviewerId(request.interviewerId());
        interview.setScheduledAt(request.scheduledAt());
        interview.setDuration(request.duration() == null ? 60 : request.duration());
        interview.setStatus(0);
        interview.setType(request.type());
        interview.setMeetingUrl(request.meetingUrl());
        interview.setRemark(request.remark());
        interview.setCreatedBy(currentUser.id());
        interviewMapper.insert(interview);

        List<Question> selectedQuestions = selectQuestions(request);
        for (int index = 0; index < selectedQuestions.size(); index++) {
            Question question = selectedQuestions.get(index);
            InterviewQuestion interviewQuestion = new InterviewQuestion();
            interviewQuestion.setInterviewId(interview.getId());
            interviewQuestion.setQuestionId(question.getId());
            interviewQuestion.setSequenceNo(index + 1);
            interviewQuestion.setMaxScore(question.getScore());
            interviewQuestion.setQuestionSnapshot(snapshot(question));
            interviewQuestionMapper.insert(interviewQuestion);
        }
        return view(interview);
    }

    public List<InterviewDtos.InterviewView> list(Integer status) {
        LambdaQueryWrapper<Interview> wrapper = new LambdaQueryWrapper<Interview>()
                .orderByDesc(Interview::getScheduledAt);
        if (status != null) {
            wrapper.eq(Interview::getStatus, status);
        }
        return interviewMapper.selectList(wrapper).stream().map(this::view).toList();
    }

    @Transactional
    public List<InterviewDtos.QuestionInInterviewView> start(Long interviewId) {
        Interview interview = requireInterview(interviewId);
        if (!currentUser.hasRole(SystemRoleService.ADMIN) && !currentUser.id().equals(interview.getInterviewerId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "无权限开始该面试");
        }
        if (!Integer.valueOf(0).equals(interview.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "当前状态不允许开始面试");
        }
        if (LocalDateTime.now().isBefore(interview.getScheduledAt().minusMinutes(startWindowMinutes))) {
            throw new BusinessException(HttpStatus.CONFLICT, "未到允许开始面试的时间窗口");
        }
        interview.setStatus(1);
        interview.setStartedAt(LocalDateTime.now());
        interviewMapper.updateById(interview);
        return questions(interviewId);
    }

    @Transactional
    public void finish(Long interviewId) {
        Interview interview = requireInterview(interviewId);
        if (!currentUser.hasRole(SystemRoleService.ADMIN) && !currentUser.id().equals(interview.getInterviewerId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "无权限结束该面试");
        }
        if (!Integer.valueOf(1).equals(interview.getStatus())) {
            return;
        }
        interview.setStatus(2);
        interview.setEndedAt(LocalDateTime.now());
        interviewMapper.updateById(interview);
        aiEvaluationGateway.enqueueInterviewEvaluation(interviewId);
    }

    @Transactional
    public void cancel(Long interviewId, String reason) {
        Interview interview = requireInterview(interviewId);
        if (!Integer.valueOf(0).equals(interview.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "仅待开始面试允许取消");
        }
        interview.setStatus(3);
        interview.setRemark(reason == null ? interview.getRemark() : reason);
        interviewMapper.updateById(interview);
    }

    @Transactional
    public InterviewDtos.QuestionInInterviewView answer(Long interviewQuestionId, InterviewDtos.AnswerRequest request) {
        InterviewQuestion interviewQuestion = interviewQuestionMapper.selectById(interviewQuestionId);
        if (interviewQuestion == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "面试题目不存在");
        }
        Interview interview = requireInterview(interviewQuestion.getInterviewId());
        if (!Integer.valueOf(1).equals(interview.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "面试已结束，不能继续提交作答");
        }
        InterviewAnswer answer = interviewAnswerMapper.selectOne(new LambdaQueryWrapper<InterviewAnswer>()
                .eq(InterviewAnswer::getInterviewQuestionId, interviewQuestionId));
        if (answer == null) {
            answer = new InterviewAnswer();
            answer.setInterviewQuestionId(interviewQuestionId);
        }
        answer.setAnswerContent(request.answerContent());
        answer.setAnswerData(request.answerData());
        answer.setAudioUrl(request.audioUrl());
        answer.setDurationSeconds(request.durationSeconds());
        answer.setAnsweredAt(LocalDateTime.now());
        if (answer.getId() == null) {
            interviewAnswerMapper.insert(answer);
        } else {
            interviewAnswerMapper.updateById(answer);
        }
        return questionView(interviewQuestion);
    }

    public List<InterviewDtos.QuestionInInterviewView> questions(Long interviewId) {
        return interviewQuestionMapper.selectList(new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getInterviewId, interviewId)
                        .orderByAsc(InterviewQuestion::getSequenceNo))
                .stream().map(this::questionView).toList();
    }

    public List<InterviewDtos.PracticeBankView> practiceBanks() {
        return questionBankMapper.selectPublicPracticeBanks().stream()
                .map(bank -> new InterviewDtos.PracticeBankView(bank.id(), bank.name(), bank.description(), bank.questionCount()))
                .toList();
    }

    private List<Question> selectQuestions(InterviewDtos.CreateRequest request) {
        if (request.questionIds() != null && !request.questionIds().isEmpty()) {
            Map<Long, Question> byId = questionMapper.selectBatchIds(request.questionIds()).stream()
                    .collect(Collectors.toMap(Question::getId, Function.identity()));
            return request.questionIds().stream().map(byId::get).filter(question -> question != null)
                    .filter(question -> Integer.valueOf(1).equals(question.getStatus())).toList();
        }
        if (request.bankId() == null) {
            return List.of();
        }
        int limit = request.questionCount() == null ? 5 : request.questionCount();
        return questionMapper.selectList(new LambdaQueryWrapper<Question>()
                        .eq(Question::getBankId, request.bankId())
                        .eq(Question::getStatus, 1)
                        .isNull(Question::getDeletedAt)
                        .orderByAsc(Question::getSortOrder)
                        .last("LIMIT " + limit))
                .stream().sorted(Comparator.comparing(Question::getSortOrder, Comparator.nullsLast(Integer::compareTo))).toList();
    }

    private void requireActiveUser(Long userId, String message) {
        UserAccount user = userMapper.selectById(userId);
        if (user == null || !Integer.valueOf(1).equals(user.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void validateCandidateRole(Long candidateId) {
        if (currentUser.hasRole(SystemRoleService.ADMIN)) {
            Long candidateRoleId = systemRoleService.requireActiveRoleId(SystemRoleService.CANDIDATE);
            boolean exists = userRoleMapper.exists(new LambdaQueryWrapper<com.tyut.aiinterview.domain.UserRole>()
                    .eq(com.tyut.aiinterview.domain.UserRole::getUserId, candidateId)
                    .eq(com.tyut.aiinterview.domain.UserRole::getRoleId, candidateRoleId));
            if (!exists) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "用户不是候选人角色");
            }
        }
    }

    private Interview requireInterview(Long interviewId) {
        Interview interview = interviewMapper.selectById(interviewId);
        if (interview == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "面试不存在");
        }
        return interview;
    }

    private InterviewDtos.InterviewView view(Interview interview) {
        return new InterviewDtos.InterviewView(interview.getId(), interview.getTitle(), interview.getCandidateId(),
                interview.getInterviewerId(), interview.getScheduledAt(), interview.getDuration(),
                interview.getStartedAt(), interview.getEndedAt(), interview.getStatus(), interview.getType(),
                interview.getMeetingUrl(), interview.getRemark());
    }

    private InterviewDtos.QuestionInInterviewView questionView(InterviewQuestion question) {
        return new InterviewDtos.QuestionInInterviewView(question.getId(), question.getQuestionId(),
                question.getSequenceNo(), question.getMaxScore(), question.getQuestionSnapshot());
    }

    private String snapshot(Question question) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "content", question.getContent(),
                    "questionType", question.getQuestionType(),
                    "options", question.getOptions() == null ? "" : question.getOptions(),
                    "tags", question.getTags() == null ? "" : question.getTags()));
        } catch (JsonProcessingException exception) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "题目快照生成失败");
        }
    }
}
