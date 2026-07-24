package com.tyut.aiinterview.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tyut.aiinterview.domain.QuestionBank;
import com.tyut.aiinterview.question.QuestionDtos;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface QuestionBankMapper extends BaseMapper<QuestionBank> {
    @Select("""
            SELECT b.id, b.name, b.description, COUNT(q.id) AS questionCount
            FROM question_bank b
            LEFT JOIN question q ON q.bank_id = b.id AND q.status = 1 AND q.deleted_at IS NULL
            WHERE b.visibility = 2 AND b.status = 1 AND b.deleted_at IS NULL
            GROUP BY b.id, b.name, b.description
            ORDER BY b.id DESC
            """)
    List<QuestionDtos.PracticeBankSummary> selectPublicPracticeBanks();
}
