package com.tyut.aiinterview.interview;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.tyut.aiinterview.security.CurrentUser;
import com.tyut.aiinterview.user.SystemRoleService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class InterviewQuestionSelectionTest {

    @Test
    void loadsManuallySelectedQuestionsInOneBatchAndKeepsRequestedOrder() {
        QuestionMapper questionMapper = mock(QuestionMapper.class);
        Question first = question(10L, "第一题");
        Question second = question(20L, "第二题");
        Question third = question(30L, "第三题");
        when(questionMapper.selectBatchIds(List.of(30L, 10L, 20L))).thenReturn(List.of(first, second, third));

        InterviewQuestionMapper interviewQuestionMapper = mock(InterviewQuestionMapper.class);
        InterviewService service = service(questionMapper, interviewQuestionMapper);
        InterviewDtos.CreateRequest request = new InterviewDtos.CreateRequest("批量选题", null, 2L,
                LocalDateTime.now().plusDays(1), 60, "ai", null, null,
                List.of(30L, 10L, 20L), null, null);

        service.create(request);

        verify(questionMapper).selectBatchIds(List.of(30L, 10L, 20L));
        ArgumentCaptor<InterviewQuestion> captor = ArgumentCaptor.forClass(InterviewQuestion.class);
        verify(interviewQuestionMapper, org.mockito.Mockito.times(3)).insert(captor.capture());
        assertEquals(List.of(30L, 10L, 20L), captor.getAllValues().stream().map(InterviewQuestion::getQuestionId).toList());
        assertEquals(List.of(1, 2, 3), captor.getAllValues().stream().map(InterviewQuestion::getSequenceNo).toList());
    }

    private InterviewService service(QuestionMapper questionMapper, InterviewQuestionMapper interviewQuestionMapper) {
        InterviewMapper interviewMapper = mock(InterviewMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        UserRoleMapper userRoleMapper = mock(UserRoleMapper.class);
        SystemRoleService systemRoleService = mock(SystemRoleService.class);
        CurrentUser currentUser = mock(CurrentUser.class);
        UserAccount candidate = new UserAccount();
        candidate.setId(2L);
        candidate.setStatus(1);
        when(currentUser.hasRole("ADMIN")).thenReturn(true);
        when(currentUser.id()).thenReturn(1L);
        when(userMapper.selectById(2L)).thenReturn(candidate);
        when(systemRoleService.requireActiveRoleId(SystemRoleService.CANDIDATE)).thenReturn(8L);
        when(userRoleMapper.exists(any())).thenReturn(true);
        return new InterviewService(interviewMapper, interviewQuestionMapper, mock(InterviewAnswerMapper.class),
                questionMapper, mock(QuestionBankMapper.class), userMapper, userRoleMapper, systemRoleService,
                mock(JobPositionMapper.class), currentUser, mock(AiEvaluationGateway.class), new ObjectMapper(), 15);
    }

    private Question question(Long id, String content) {
        Question question = new Question();
        question.setId(id);
        question.setContent(content);
        question.setQuestionType("short_answer");
        question.setStatus(1);
        question.setScore(BigDecimal.TEN);
        return question;
    }
}
