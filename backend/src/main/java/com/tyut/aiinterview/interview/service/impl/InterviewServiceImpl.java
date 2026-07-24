package com.tyut.aiinterview.interview.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.interview.dto.*;
import com.tyut.aiinterview.interview.entity.Interview;
import com.tyut.aiinterview.interview.entity.InterviewAnswer;
import com.tyut.aiinterview.interview.entity.InterviewQuestion;
import com.tyut.aiinterview.interview.mapper.InterviewAnswerMapper;
import com.tyut.aiinterview.interview.mapper.InterviewMapper;
import com.tyut.aiinterview.interview.mapper.InterviewQuestionMapper;
import com.tyut.aiinterview.interview.service.InterviewService;
import com.tyut.aiinterview.question.entity.Question;
import com.tyut.aiinterview.question.mapper.QuestionMapper;
import com.tyut.aiinterview.user.entity.User;
import com.tyut.aiinterview.user.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class InterviewServiceImpl implements InterviewService {

    private static final Logger log = LoggerFactory.getLogger(InterviewServiceImpl.class);

    private final InterviewMapper interviewMapper;
    private final InterviewQuestionMapper interviewQuestionMapper;
    private final InterviewAnswerMapper interviewAnswerMapper;
    private final QuestionMapper questionMapper;
    private final UserMapper userMapper;

    /** Window (minutes) before scheduled_at when interview can start */
    private static final int START_WINDOW_MINUTES = 10;

    public InterviewServiceImpl(InterviewMapper interviewMapper,
                                InterviewQuestionMapper interviewQuestionMapper,
                                InterviewAnswerMapper interviewAnswerMapper,
                                QuestionMapper questionMapper,
                                UserMapper userMapper) {
        this.interviewMapper = interviewMapper;
        this.interviewQuestionMapper = interviewQuestionMapper;
        this.interviewAnswerMapper = interviewAnswerMapper;
        this.questionMapper = questionMapper;
        this.userMapper = userMapper;
    }

    // ===== HR Operations =====

    @Override
    @Transactional
    public InterviewVO createInterview(CreateInterviewRequest request, Long userId) {
        // Validate users exist and are enabled
        User candidate = validateUser(request.getCandidateId(), "候选人");
        User interviewer = validateUser(request.getInterviewerId(), "面试官");

        // Validate questions exist
        List<Question> questions = questionMapper.selectBatchIds(request.getQuestionIds());
        if (questions.size() != request.getQuestionIds().size()) {
            throw new BusinessException("部分题目不存在或已被删除");
        }

        // Conflict detection (US-02)
        checkConflict(request.getCandidateId(), request.getScheduledAt(),
                request.getScheduledAt().plusMinutes(request.getDuration()));
        checkConflict(request.getInterviewerId(), request.getScheduledAt(),
                request.getScheduledAt().plusMinutes(request.getDuration()));

        // Create interview
        Interview interview = new Interview();
        interview.setTitle(request.getTitle());
        interview.setCandidateId(request.getCandidateId());
        interview.setInterviewerId(request.getInterviewerId());
        interview.setScheduledAt(request.getScheduledAt());
        interview.setDuration(request.getDuration());
        interview.setType(request.getType());
        interview.setMeetingUrl(request.getMeetingUrl());
        interview.setRemark(request.getRemark());
        interview.setStatus(0); // pending
        interview.setCreatedBy(userId);
        interviewMapper.insert(interview);

        // Link questions
        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            InterviewQuestion iq = new InterviewQuestion();
            iq.setInterviewId(interview.getId());
            iq.setQuestionId(q.getId());
            iq.setSequenceNo(i + 1);
            iq.setMaxScore(q.getScore());
            // Snapshot question content for immutability
            iq.setQuestionSnapshot(buildQuestionSnapshot(q));
            interviewQuestionMapper.insert(iq);
        }

        log.info("Interview created: id={}, candidate={}, interviewer={}, scheduled={}",
                interview.getId(), candidate.getRealName(), interviewer.getRealName(), request.getScheduledAt());

        InterviewVO vo = InterviewVO.from(interview);
        vo.setCandidateName(candidate.getRealName());
        vo.setInterviewerName(interviewer.getRealName());
        return vo;
    }

    @Override
    @Transactional
    public InterviewVO updateInterview(Long id, UpdateInterviewRequest request) {
        Interview interview = interviewMapper.selectById(id);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }
        if (interview.getStatus() != 0) {
            throw new BusinessException("当前状态不允许修改，仅待开始状态的面试可以修改");
        }

        if (request.getScheduledAt() != null) {
            LocalDateTime end = request.getScheduledAt().plusMinutes(
                    request.getDuration() != null ? request.getDuration() : interview.getDuration());
            checkConflictExcluding(interview.getCandidateId(), request.getScheduledAt(), end, id);
            checkConflictExcluding(interview.getInterviewerId(), request.getScheduledAt(), end, id);
            interview.setScheduledAt(request.getScheduledAt());
        }
        if (request.getTitle() != null) {
            interview.setTitle(request.getTitle());
        }
        if (request.getDuration() != null) {
            interview.setDuration(request.getDuration());
        }
        if (request.getMeetingUrl() != null) {
            interview.setMeetingUrl(request.getMeetingUrl());
        }
        if (request.getRemark() != null) {
            interview.setRemark(request.getRemark());
        }

        interviewMapper.updateById(interview);
        log.info("Interview updated: id={}", id);

        return buildVO(interview);
    }

    @Override
    @Transactional
    public void cancelInterview(Long id, String reason, Long operatorId) {
        Interview interview = interviewMapper.selectById(id);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }
        if (interview.getStatus() == 2) {
            throw new BusinessException("已结束的面试不能取消");
        }

        interview.setStatus(3); // cancelled
        interview.setRemark((interview.getRemark() == null ? "" : interview.getRemark() + "; ")
                + "取消原因: " + (reason != null ? reason : "无"));
        interviewMapper.updateById(interview);

        log.info("Interview cancelled: id={}, reason={}, operator={}", id, reason, operatorId);
    }

    @Override
    @Transactional
    public void markCandidateAbsent(Long id, Long operatorId) {
        Interview interview = interviewMapper.selectById(id);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }
        if (interview.getStatus() != 0 && interview.getStatus() != 1) {
            throw new BusinessException("当前状态不允许标记缺席");
        }

        interview.setStatus(3); // cancelled
        interview.setRemark((interview.getRemark() == null ? "" : interview.getRemark() + "; ")
                + "候选人缺席，操作人ID: " + operatorId);
        interviewMapper.updateById(interview);

        log.info("Candidate absence marked: interview={}, operator={}", id, operatorId);
    }

    // ===== Interview Flow =====

    @Override
    @Transactional
    public List<InterviewQuestion> startInterview(Long id, Long operatorId) {
        Interview interview = interviewMapper.selectById(id);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }

        // US-04: only designated interviewer can start
        if (!interview.getInterviewerId().equals(operatorId)) {
            // Allow HR to start as well for flexibility
            User opUser = userMapper.selectById(operatorId);
            boolean isHr = opUser != null && hasRole(operatorId, "HR");
            if (!isHr) {
                throw new BusinessException(403, "无权限：只有指定的面试官或HR可以开始面试");
            }
        }

        // US-04: status check
        if (interview.getStatus() != 0) {
            throw new BusinessException("当前状态不允许开始，面试状态: " + statusText(interview.getStatus()));
        }

        // US-04: time window check
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(interview.getScheduledAt().minusMinutes(START_WINDOW_MINUTES))) {
            throw new BusinessException("未到允许开始的时间窗口，预约时间为: " + interview.getScheduledAt());
        }

        // Check has questions
        long questionCount = interviewQuestionMapper.selectCount(
                new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getInterviewId, id));
        if (questionCount == 0) {
            throw new BusinessException("面试未关联任何题目，无法开始");
        }

        // Update status: pending -> in_progress (optimistic: conditional update)
        interview.setStatus(1);
        interview.setStartedAt(now);
        interviewMapper.updateById(interview);

        // Return questions without correct_answer for candidate side (US-03)
        List<InterviewQuestion> questions = interviewQuestionMapper.selectList(
                new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getInterviewId, id)
                        .orderByAsc(InterviewQuestion::getSequenceNo));

        log.info("Interview started: id={}, operator={}", id, operatorId);
        return questions;
    }

    @Override
    @Transactional
    public void endInterview(Long id, Long operatorId) {
        Interview interview = interviewMapper.selectById(id);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }

        // Only designated interviewer or HR can end
        if (!interview.getInterviewerId().equals(operatorId)) {
            User opUser = userMapper.selectById(operatorId);
            boolean isHr = opUser != null && hasRole(operatorId, "HR");
            if (!isHr) {
                throw new BusinessException(403, "无权限：只有指定的面试官或HR可以结束面试");
            }
        }

        // US-07: only in_progress -> completed
        if (interview.getStatus() != 1) {
            throw new BusinessException("当前状态不允许结束，面试状态: " + statusText(interview.getStatus()));
        }

        // Idempotent: repeated end does nothing
        if (interview.getEndedAt() != null) {
            return;
        }

        interview.setStatus(2);
        interview.setEndedAt(LocalDateTime.now());
        interviewMapper.updateById(interview);

        // US-07: trigger AI evaluation tasks (placeholder — actual AI call to be implemented)
        log.info("Interview ended: id={}, operator={}, AI evaluation tasks would be triggered here", id, operatorId);
    }

    // ===== Answer Operations =====

    @Override
    @Transactional
    public InterviewAnswer submitAnswer(Long interviewQuestionId, SubmitAnswerRequest request, Long candidateId) {
        // Validate the interview question exists
        InterviewQuestion iq = interviewQuestionMapper.selectById(interviewQuestionId);
        if (iq == null) {
            throw new BusinessException(404, "面试题目不存在");
        }

        // Validate interview exists and is in_progress
        Interview interview = interviewMapper.selectById(iq.getInterviewId());
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }

        // US-06: only in_progress can submit
        if (interview.getStatus() != 1) {
            throw new BusinessException("面试已结束，不能继续提交作答");
        }

        // Verify candidate
        if (!interview.getCandidateId().equals(candidateId)) {
            throw new BusinessException(403, "无权限：只有指定的候选人可以提交作答");
        }

        // US-05: upsert answer (one answer per interview_question)
        InterviewAnswer answer = interviewAnswerMapper.selectOne(
                new LambdaQueryWrapper<InterviewAnswer>()
                        .eq(InterviewAnswer::getInterviewQuestionId, interviewQuestionId));

        if (answer == null) {
            answer = new InterviewAnswer();
            answer.setInterviewQuestionId(interviewQuestionId);
        }

        answer.setAnswerContent(request.getAnswerContent());
        answer.setAnswerData(request.getAnswerData());
        answer.setAudioUrl(request.getAudioUrl());
        answer.setDurationSeconds(request.getDurationSeconds());
        answer.setAnsweredAt(LocalDateTime.now());

        if (answer.getId() == null) {
            interviewAnswerMapper.insert(answer);
        } else {
            interviewAnswerMapper.updateById(answer);
        }

        log.info("Answer submitted: interviewQuestionId={}, candidate={}", interviewQuestionId, candidateId);
        return answer;
    }

    // ===== Query =====

    @Override
    public Page<InterviewVO> listInterviews(Long userId, String role, Integer status,
                                            Integer page, Integer size) {
        LambdaQueryWrapper<Interview> wrapper = new LambdaQueryWrapper<>();

        switch (role) {
            case "HR", "ADMIN" -> {
                // HR/Admin see all interviews
            }
            case "INTERVIEWER" -> wrapper.eq(Interview::getInterviewerId, userId);
            case "CANDIDATE" -> wrapper.eq(Interview::getCandidateId, userId);
            default -> throw new BusinessException(403, "未知角色");
        }

        if (status != null) {
            wrapper.eq(Interview::getStatus, status);
        }
        wrapper.orderByDesc(Interview::getScheduledAt);

        Page<Interview> interviewPage = interviewMapper.selectPage(new Page<>(page, size), wrapper);
        Page<InterviewVO> voPage = new Page<>(page, size, interviewPage.getTotal());
        voPage.setRecords(interviewPage.getRecords().stream().map(this::buildVO).toList());
        return voPage;
    }

    @Override
    public InterviewVO getInterviewDetail(Long id) {
        Interview interview = interviewMapper.selectById(id);
        if (interview == null) {
            throw new BusinessException(404, "面试不存在");
        }
        return buildVO(interview);
    }

    @Override
    public List<InterviewQuestion> getInterviewQuestions(Long interviewId, boolean includeAnswer) {
        List<InterviewQuestion> questions = interviewQuestionMapper.selectList(
                new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getInterviewId, interviewId)
                        .orderByAsc(InterviewQuestion::getSequenceNo));

        // Strip correct_answer from question snapshot when called from candidate side
        if (!includeAnswer) {
            for (InterviewQuestion iq : questions) {
                if (iq.getQuestionSnapshot() != null) {
                    // The snapshot may contain correct_answer — strip it for candidate view
                    iq.setQuestionSnapshot(cleanSnapshotForCandidate(iq.getQuestionSnapshot()));
                }
            }
        }

        return questions;
    }

    @Override
    public List<InterviewAnswer> getInterviewAnswers(Long interviewId) {
        // Get all interview_question IDs for this interview
        List<InterviewQuestion> questions = interviewQuestionMapper.selectList(
                new LambdaQueryWrapper<InterviewQuestion>()
                        .eq(InterviewQuestion::getInterviewId, interviewId));
        List<Long> iqIds = questions.stream().map(InterviewQuestion::getId).toList();

        if (iqIds.isEmpty()) {
            return List.of();
        }

        return interviewAnswerMapper.selectList(
                new LambdaQueryWrapper<InterviewAnswer>()
                        .in(InterviewAnswer::getInterviewQuestionId, iqIds));
    }

    // ===== Private helpers =====

    private void checkConflict(Long userId, LocalDateTime start, LocalDateTime end) {
        List<Interview> conflicts = interviewMapper.selectList(new LambdaQueryWrapper<Interview>()
                .and(w -> w.eq(Interview::getCandidateId, userId).or().eq(Interview::getInterviewerId, userId))
                .in(Interview::getStatus, 0, 1) // pending or in_progress
                .lt(Interview::getScheduledAt, end)
                .apply("DATE_ADD(scheduled_at, INTERVAL duration MINUTE) > {0}", start));

        if (!conflicts.isEmpty()) {
            Interview conflict = conflicts.get(0);
            User u = userMapper.selectById(userId);
            String userName = u != null ? u.getRealName() : "ID:" + userId;
            throw new BusinessException("日程冲突：" + userName + " 在 "
                    + conflict.getScheduledAt() + " 已有面试「" + conflict.getTitle() + "」，"
                    + "时间范围重叠，请调整预约时间");
        }
    }

    private void checkConflictExcluding(Long userId, LocalDateTime start, LocalDateTime end, Long excludeInterviewId) {
        List<Interview> conflicts = interviewMapper.selectList(new LambdaQueryWrapper<Interview>()
                .and(w -> w.eq(Interview::getCandidateId, userId).or().eq(Interview::getInterviewerId, userId))
                .in(Interview::getStatus, 0, 1)
                .ne(Interview::getId, excludeInterviewId)
                .lt(Interview::getScheduledAt, end)
                .apply("DATE_ADD(scheduled_at, INTERVAL duration MINUTE) > {0}", start));

        if (!conflicts.isEmpty()) {
            Interview conflict = conflicts.get(0);
            User u = userMapper.selectById(userId);
            String userName = u != null ? u.getRealName() : "ID:" + userId;
            throw new BusinessException("日程冲突：" + userName + " 在 "
                    + conflict.getScheduledAt() + " 已有面试「" + conflict.getTitle() + "」，请调整预约时间");
        }
    }

    private User validateUser(Long userId, String roleLabel) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, roleLabel + "不存在");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(roleLabel + "账户已被禁用");
        }
        return user;
    }

    private boolean hasRole(Long userId, String roleCode) {
        List<String> roles = userMapper.selectRoleCodesByUserId(userId);
        return roles.contains(roleCode);
    }

    private InterviewVO buildVO(Interview interview) {
        InterviewVO vo = InterviewVO.from(interview);
        User candidate = userMapper.selectById(interview.getCandidateId());
        if (candidate != null) {
            vo.setCandidateName(candidate.getRealName());
        }
        User interviewer = userMapper.selectById(interview.getInterviewerId());
        if (interviewer != null) {
            vo.setInterviewerName(interviewer.getRealName());
        }
        vo.setStatusText(statusText(interview.getStatus()));
        return vo;
    }

    private String buildQuestionSnapshot(Question q) {
        return "{\"content\":\"" + escapeJson(q.getContent()) + "\","
                + "\"questionType\":\"" + q.getQuestionType() + "\","
                + "\"difficulty\":" + q.getDifficulty() + ","
                + "\"options\":" + (q.getOptions() != null ? q.getOptions() : "null") + ","
                + "\"correct_answer\":" + (q.getCorrectAnswer() != null ? q.getCorrectAnswer() : "null") + ","
                + "\"answer_template\":\"" + escapeJson(q.getAnswerTemplate()) + "\"}";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private String cleanSnapshotForCandidate(String snapshot) {
        if (snapshot == null) return null;
        // Remove correct_answer and answer_template fields for candidate view
        return snapshot
                .replaceAll("\"correct_answer\"\\s*:\\s*[^,}]+[,}]", "")
                .replaceAll("\"answer_template\"\\s*:\\s*\"[^\"]*\"", "")
                .replaceAll(",,", ",")
                .replaceAll(",\\s*}", "}")
                .replaceAll("\\{,\\s*", "{");
    }

    private String statusText(Integer status) {
        return switch (status) {
            case 0 -> "待开始";
            case 1 -> "进行中";
            case 2 -> "已结束";
            case 3 -> "已取消";
            default -> "未知";
        };
    }
}
