package com.tyut.aiinterview.question.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.question.dto.QuestionBankRequest;
import com.tyut.aiinterview.question.dto.QuestionRequest;
import com.tyut.aiinterview.question.dto.QuestionVO;
import com.tyut.aiinterview.question.entity.Question;
import com.tyut.aiinterview.question.entity.QuestionBank;
import com.tyut.aiinterview.question.mapper.QuestionBankMapper;
import com.tyut.aiinterview.question.mapper.QuestionMapper;
import com.tyut.aiinterview.question.service.QuestionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class QuestionServiceImpl implements QuestionService {

    private final QuestionBankMapper bankMapper;
    private final QuestionMapper questionMapper;

    public QuestionServiceImpl(QuestionBankMapper bankMapper, QuestionMapper questionMapper) {
        this.bankMapper = bankMapper;
        this.questionMapper = questionMapper;
    }

    // ===== Question Bank =====

    @Override
    public QuestionBank createBank(QuestionBankRequest request, Long userId) {
        if (bankMapper.selectCount(new LambdaQueryWrapper<QuestionBank>()
                .eq(QuestionBank::getBankCode, request.getBankCode())) > 0) {
            throw new BusinessException("题库编码已存在");
        }
        QuestionBank bank = new QuestionBank();
        bank.setBankCode(request.getBankCode());
        bank.setName(request.getName());
        bank.setDescription(request.getDescription());
        bank.setVisibility(request.getVisibility());
        bank.setStatus(1);
        bank.setCreatedBy(userId);
        bankMapper.insert(bank);
        return bank;
    }

    @Override
    public QuestionBank updateBank(Long id, QuestionBankRequest request) {
        QuestionBank bank = bankMapper.selectById(id);
        if (bank == null) {
            throw new BusinessException(404, "题库不存在");
        }
        if (!bank.getBankCode().equals(request.getBankCode())
                && bankMapper.selectCount(new LambdaQueryWrapper<QuestionBank>()
                        .eq(QuestionBank::getBankCode, request.getBankCode())) > 0) {
            throw new BusinessException("题库编码已存在");
        }
        bank.setBankCode(request.getBankCode());
        bank.setName(request.getName());
        bank.setDescription(request.getDescription());
        bank.setVisibility(request.getVisibility());
        bankMapper.updateById(bank);
        return bank;
    }

    @Override
    public List<QuestionBank> listBanks() {
        return bankMapper.selectList(new LambdaQueryWrapper<QuestionBank>()
                .eq(QuestionBank::getStatus, 1)
                .orderByDesc(QuestionBank::getCreatedAt));
    }

    @Override
    public void deleteBank(Long id) {
        if (questionMapper.selectCount(new LambdaQueryWrapper<Question>()
                .eq(Question::getBankId, id)) > 0) {
            throw new BusinessException("题库下存在题目，不能删除");
        }
        bankMapper.deleteById(id);
    }

    // ===== Questions =====

    @Override
    public QuestionVO createQuestion(QuestionRequest request, Long userId) {
        if (bankMapper.selectById(request.getBankId()) == null) {
            throw new BusinessException(404, "题库不存在");
        }
        Question q = new Question();
        fillQuestion(q, request);
        q.setStatus(1);
        q.setCreatedBy(userId);
        questionMapper.insert(q);
        return QuestionVO.from(q);
    }

    @Override
    public QuestionVO updateQuestion(Long id, QuestionRequest request) {
        Question q = questionMapper.selectById(id);
        if (q == null) {
            throw new BusinessException(404, "题目不存在");
        }
        fillQuestion(q, request);
        questionMapper.updateById(q);
        return QuestionVO.from(q);
    }

    @Override
    public Page<QuestionVO> listQuestions(Long bankId, String questionType, Integer difficulty,
                                          Integer status, Integer page, Integer size) {
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        if (bankId != null) {
            wrapper.eq(Question::getBankId, bankId);
        }
        if (StringUtils.hasText(questionType)) {
            wrapper.eq(Question::getQuestionType, questionType);
        }
        if (difficulty != null) {
            wrapper.eq(Question::getDifficulty, difficulty);
        }
        if (status != null) {
            wrapper.eq(Question::getStatus, status);
        }
        wrapper.orderByAsc(Question::getSortOrder).orderByDesc(Question::getCreatedAt);

        Page<Question> questionPage = questionMapper.selectPage(new Page<>(page, size), wrapper);
        Page<QuestionVO> voPage = new Page<>(page, size, questionPage.getTotal());
        voPage.setRecords(questionPage.getRecords().stream().map(QuestionVO::from).toList());
        return voPage;
    }

    @Override
    public QuestionVO getQuestionById(Long id) {
        Question q = questionMapper.selectById(id);
        if (q == null) {
            throw new BusinessException(404, "题目不存在");
        }
        QuestionVO vo = QuestionVO.from(q);
        QuestionBank bank = bankMapper.selectById(q.getBankId());
        if (bank != null) {
            vo.setBankName(bank.getName());
        }
        return vo;
    }

    @Override
    public void updateQuestionStatus(Long id, Integer status) {
        Question q = questionMapper.selectById(id);
        if (q == null) {
            throw new BusinessException(404, "题目不存在");
        }
        q.setStatus(status);
        questionMapper.updateById(q);
    }

    @Override
    public void deleteQuestion(Long id) {
        questionMapper.deleteById(id);
    }

    private void fillQuestion(Question q, QuestionRequest request) {
        q.setBankId(request.getBankId());
        q.setQuestionType(request.getQuestionType());
        q.setDifficulty(request.getDifficulty());
        q.setContent(request.getContent());
        q.setOptions(toJsonValue(request.getOptions()));
        q.setCorrectAnswer(toJsonValue(request.getCorrectAnswer()));
        q.setAnswerTemplate(request.getAnswerTemplate());
        q.setExplanation(request.getExplanation());
        q.setTags(toJsonValue(request.getTags()));
        q.setScore(request.getScore());
        if (request.getSortOrder() != null) {
            q.setSortOrder(request.getSortOrder());
        }
    }

    /** Wrap string as valid JSON if the database column is JSON type */
    private String toJsonValue(String value) {
        if (value == null || value.isEmpty()) return value;
        // If already looks like JSON (starts with [ or {), return as-is
        String trimmed = value.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{") || trimmed.startsWith("\"")) return value;
        // Wrap plain string as JSON string value
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
