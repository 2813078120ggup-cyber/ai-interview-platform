package com.tyut.aiinterview.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tyut.aiinterview.domain.Evaluation;
import com.tyut.aiinterview.domain.InterviewAnswer;
import com.tyut.aiinterview.domain.InterviewQuestion;
import com.tyut.aiinterview.domain.Question;
import com.tyut.aiinterview.mapper.EvaluationMapper;
import com.tyut.aiinterview.mapper.InterviewAnswerMapper;
import com.tyut.aiinterview.mapper.QuestionMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class AiEvaluationDataLoaderTest {

    @Test
    void loadsQuestionAnswerAndEvaluationDataInBatches() {
        QuestionMapper questionMapper = mock(QuestionMapper.class);
        InterviewAnswerMapper answerMapper = mock(InterviewAnswerMapper.class);
        EvaluationMapper evaluationMapper = mock(EvaluationMapper.class);
        InterviewQuestion first = interviewQuestion(101L, 1L);
        InterviewQuestion second = interviewQuestion(102L, 2L);
        Question source = new Question();
        source.setId(1L);
        InterviewAnswer answer = new InterviewAnswer();
        answer.setInterviewQuestionId(101L);
        Evaluation evaluation = new Evaluation();
        evaluation.setInterviewQuestionId(102L);
        when(questionMapper.selectBatchIds(List.of(1L, 2L))).thenReturn(List.of(source));
        when(answerMapper.selectList(any())).thenReturn(List.of(answer));
        when(evaluationMapper.selectList(any())).thenReturn(List.of(evaluation));

        List<AiEvaluationDataLoader.EvaluationInput> inputs =
                new AiEvaluationDataLoader(questionMapper, answerMapper, evaluationMapper).load(List.of(first, second));

        assertEquals(source, inputs.get(0).sourceQuestion());
        assertEquals(answer, inputs.get(0).answer());
        assertEquals(evaluation, inputs.get(1).existingEvaluation());
        verify(questionMapper).selectBatchIds(List.of(1L, 2L));
        verify(answerMapper).selectList(any());
        verify(evaluationMapper).selectList(any());
    }

    private InterviewQuestion interviewQuestion(Long id, Long questionId) {
        InterviewQuestion question = new InterviewQuestion();
        question.setId(id);
        question.setQuestionId(questionId);
        return question;
    }
}
