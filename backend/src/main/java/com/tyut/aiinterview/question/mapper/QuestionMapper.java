package com.tyut.aiinterview.question.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tyut.aiinterview.question.entity.Question;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {
}
