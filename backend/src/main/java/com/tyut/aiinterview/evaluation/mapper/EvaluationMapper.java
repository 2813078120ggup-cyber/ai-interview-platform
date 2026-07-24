package com.tyut.aiinterview.evaluation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tyut.aiinterview.evaluation.entity.Evaluation;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface EvaluationMapper extends BaseMapper<Evaluation> {

    List<Evaluation> findByInterviewQuestionId(Long interviewQuestionId);

    List<Evaluation> findByInterviewId(Long interviewId);
}
