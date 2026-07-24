package com.tyut.aiinterview.interview.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tyut.aiinterview.interview.entity.Interview;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface InterviewMapper extends BaseMapper<Interview> {
}
