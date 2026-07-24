package com.tyut.aiinterview.interview.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tyut.aiinterview.interview.entity.InterviewQuestion;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface InterviewQuestionMapper extends BaseMapper<InterviewQuestion> {
}
