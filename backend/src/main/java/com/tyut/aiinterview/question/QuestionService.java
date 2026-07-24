package com.tyut.aiinterview.question;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.domain.Question;
import com.tyut.aiinterview.domain.QuestionBank;
import com.tyut.aiinterview.mapper.QuestionBankMapper;
import com.tyut.aiinterview.mapper.QuestionMapper;
import com.tyut.aiinterview.security.CurrentUser;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionService {
    private final QuestionBankMapper questionBankMapper;
    private final QuestionMapper questionMapper;
    private final CurrentUser currentUser;

    public QuestionService(QuestionBankMapper questionBankMapper, QuestionMapper questionMapper, CurrentUser currentUser) {
        this.questionBankMapper = questionBankMapper;
        this.questionMapper = questionMapper;
        this.currentUser = currentUser;
    }

    public List<QuestionDtos.BankView> banks() {
        return questionBankMapper.selectList(new LambdaQueryWrapper<QuestionBank>()
                        .isNull(QuestionBank::getDeletedAt)
                        .orderByDesc(QuestionBank::getId))
                .stream().map(bank -> new QuestionDtos.BankView(bank.getId(), bank.getBankCode(), bank.getName(),
                        bank.getDescription(), bank.getVisibility(), bank.getStatus(), null)).toList();
    }

    @Transactional
    public QuestionDtos.BankView createBank(QuestionDtos.BankRequest request) {
        QuestionBank bank = new QuestionBank();
        bank.setBankCode(request.bankCode());
        bank.setName(request.name());
        bank.setDescription(request.description());
        bank.setVisibility(request.visibility() == null ? 0 : request.visibility());
        bank.setStatus(request.status() == null ? 1 : request.status());
        bank.setCreatedBy(currentUser.id());
        questionBankMapper.insert(bank);
        return new QuestionDtos.BankView(bank.getId(), bank.getBankCode(), bank.getName(), bank.getDescription(),
                bank.getVisibility(), bank.getStatus(), 0L);
    }

    public List<QuestionDtos.QuestionView> questions(Long bankId, String keyword) {
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<Question>()
                .isNull(Question::getDeletedAt)
                .orderByAsc(Question::getSortOrder)
                .orderByDesc(Question::getId);
        if (bankId != null) {
            wrapper.eq(Question::getBankId, bankId);
        }
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(nested -> nested.like(Question::getContent, keyword).or().like(Question::getTags, keyword));
        }
        return questionMapper.selectList(wrapper).stream().map(this::view).toList();
    }

    @Transactional
    public QuestionDtos.QuestionView createQuestion(QuestionDtos.QuestionRequest request) {
        Question question = toQuestion(request);
        questionMapper.insert(question);
        return view(question);
    }

    @Transactional
    public List<QuestionDtos.QuestionView> generate(QuestionDtos.GenerateRequest request) {
        int count = request.count() == null ? 5 : Math.min(Math.max(request.count(), 1), 10);
        return java.util.stream.IntStream.rangeClosed(1, count).mapToObj(index -> {
            Question question = new Question();
            question.setBankId(request.bankId());
            question.setQuestionType("short_answer");
            question.setDifficulty(request.difficulty() == null ? 2 : request.difficulty());
            question.setContent("针对" + request.role() + "生成问题 " + index + "：请结合"
                    + (request.focus() == null ? "岗位核心能力" : request.focus()) + "说明你的实践经验。");
            question.setTags("[\"" + request.role() + "\"]");
            question.setScore(BigDecimal.TEN);
            question.setSortOrder(0);
            question.setStatus(0);
            question.setCreatedBy(currentUser.id());
            questionMapper.insert(question);
            return view(question);
        }).toList();
    }

    private Question toQuestion(QuestionDtos.QuestionRequest request) {
        Question question = new Question();
        question.setBankId(request.bankId());
        question.setQuestionType(request.questionType());
        question.setDifficulty(request.difficulty() == null ? 2 : request.difficulty());
        question.setContent(request.content());
        question.setOptions(request.options());
        question.setCorrectAnswer(request.correctAnswer());
        question.setAnswerTemplate(request.answerTemplate());
        question.setExplanation(request.explanation());
        question.setTags(request.tags() == null ? null : request.tags().toString());
        question.setScore(request.score() == null ? BigDecimal.TEN : request.score());
        question.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        question.setStatus(request.status() == null ? 0 : request.status());
        question.setCreatedBy(currentUser.id());
        return question;
    }

    private QuestionDtos.QuestionView view(Question question) {
        return new QuestionDtos.QuestionView(question.getId(), question.getBankId(), question.getQuestionType(),
                question.getDifficulty(), question.getContent(), question.getOptions(), question.getAnswerTemplate(),
                question.getExplanation(), question.getTags(), question.getScore(), question.getSortOrder(),
                question.getStatus());
    }
}
