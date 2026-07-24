package com.tyut.aiinterview.question.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tyut.aiinterview.question.entity.QuestionBank;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuestionBankMapper extends BaseMapper<QuestionBank> {
}
