package com.tyut.aiinterview.interview;

import org.springframework.stereotype.Component;

@Component
public class NoopAiEvaluationGateway implements AiEvaluationGateway {
    @Override
    public void enqueueInterviewEvaluation(Long interviewId) {
    }
}
