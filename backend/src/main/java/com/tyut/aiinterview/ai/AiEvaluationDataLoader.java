package com.tyut.aiinterview.ai;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.domain.Evaluation;
import com.tyut.aiinterview.domain.InterviewAnswer;
import com.tyut.aiinterview.domain.InterviewQuestion;
import com.tyut.aiinterview.domain.Question;
import com.tyut.aiinterview.mapper.EvaluationMapper;
import com.tyut.aiinterview.mapper.InterviewAnswerMapper;
import com.tyut.aiinterview.mapper.QuestionMapper;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.springframework.stereotype.Service;

/**
 * Loads all data required for one interview evaluation using a fixed number of
 * queries, rather than querying related records once per interview question.
 */
@Service
public class AiEvaluationDataLoader {
    private final QuestionMapper questionMapper;
    private final InterviewAnswerMapper answerMapper;
    private final EvaluationMapper evaluationMapper;

    public AiEvaluationDataLoader(QuestionMapper questionMapper, InterviewAnswerMapper answerMapper,
                                  EvaluationMapper evaluationMapper) {
        this.questionMapper = questionMapper;
        this.answerMapper = answerMapper;
        this.evaluationMapper = evaluationMapper;
    }

    public List<EvaluationInput> load(List<InterviewQuestion> interviewQuestions) {
        List<Long> interviewQuestionIds = interviewQuestions.stream().map(InterviewQuestion::getId).toList();
        List<Long> questionIds = interviewQuestions.stream().map(InterviewQuestion::getQuestionId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        Map<Long, Question> questions = questionIds.isEmpty() ? Map.of() : questionMapper.selectBatchIds(questionIds).stream()
                .collect(java.util.stream.Collectors.toMap(Question::getId, Function.identity()));
        Map<Long, InterviewAnswer> answers = answerMapper.selectList(new LambdaQueryWrapper<InterviewAnswer>()
                        .in(InterviewAnswer::getInterviewQuestionId, interviewQuestionIds)).stream()
                .collect(java.util.stream.Collectors.toMap(InterviewAnswer::getInterviewQuestionId, Function.identity()));
        Map<Long, Evaluation> evaluations = evaluationMapper.selectList(new LambdaQueryWrapper<Evaluation>()
                        .in(Evaluation::getInterviewQuestionId, interviewQuestionIds)
                        .eq(Evaluation::getSource, "ai")).stream()
                .collect(java.util.stream.Collectors.toMap(Evaluation::getInterviewQuestionId, Function.identity(), (first, ignored) -> first));
        return interviewQuestions.stream().map(question -> new EvaluationInput(question, questions.get(question.getQuestionId()),
                answers.get(question.getId()), evaluations.get(question.getId()))).toList();
    }

    public record EvaluationInput(InterviewQuestion interviewQuestion, Question sourceQuestion,
                                  InterviewAnswer answer, Evaluation existingEvaluation) {
    }
}
