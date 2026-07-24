package com.tyut.aiinterview.interview;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;
import org.junit.jupiter.api.Test;

class InterviewPracticeBankQueryTest {

    @Test
    void loadsPracticeBanksFromSingleAggregateQuery() {
        QuestionBankMapper questionBankMapper = mock(QuestionBankMapper.class);
        QuestionMapper questionMapper = mock(QuestionMapper.class);
        when(questionBankMapper.selectPublicPracticeBanks()).thenReturn(List.of(
                new QuestionDtos.PracticeBankSummary(1L, "Java 基础", "适合日常练习", 30L)));

        List<InterviewDtos.PracticeBankView> banks = service(questionMapper, questionBankMapper).practiceBanks();

        assertEquals(1, banks.size());
        assertEquals("Java 基础", banks.get(0).name());
        assertEquals(30L, banks.get(0).questionCount());
        verifyNoInteractions(questionMapper);
    }

    private InterviewService service(QuestionMapper questionMapper, QuestionBankMapper questionBankMapper) {
        return new InterviewService(mock(InterviewMapper.class), mock(InterviewQuestionMapper.class),
                mock(InterviewAnswerMapper.class), questionMapper, questionBankMapper, mock(UserMapper.class),
                mock(UserRoleMapper.class), mock(SystemRoleService.class), mock(JobPositionMapper.class),
                mock(CurrentUser.class), mock(AiEvaluationGateway.class), new ObjectMapper(), 15);
    }
}
