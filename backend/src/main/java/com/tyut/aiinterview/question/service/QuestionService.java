package com.tyut.aiinterview.question.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.question.dto.QuestionBankRequest;
import com.tyut.aiinterview.question.dto.QuestionRequest;
import com.tyut.aiinterview.question.dto.QuestionVO;
import com.tyut.aiinterview.question.entity.QuestionBank;

import java.util.List;

public interface QuestionService {

    // Question Bank
    QuestionBank createBank(QuestionBankRequest request, Long userId);

    QuestionBank updateBank(Long id, QuestionBankRequest request);

    List<QuestionBank> listBanks();

    void deleteBank(Long id);

    // Questions
    QuestionVO createQuestion(QuestionRequest request, Long userId);

    QuestionVO updateQuestion(Long id, QuestionRequest request);

    Page<QuestionVO> listQuestions(Long bankId, String questionType, Integer difficulty, Integer status,
                                   Integer page, Integer size);

    QuestionVO getQuestionById(Long id);

    void updateQuestionStatus(Long id, Integer status);

    void deleteQuestion(Long id);
}
