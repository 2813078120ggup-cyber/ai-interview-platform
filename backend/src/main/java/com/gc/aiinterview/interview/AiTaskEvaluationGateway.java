package com.gc.aiinterview.interview;

import com.gc.aiinterview.ai.AiTaskService;
import com.gc.aiinterview.domain.Interview;
import org.springframework.stereotype.Component;

@Component
public class AiTaskEvaluationGateway implements AiEvaluationGateway {
    private final AiTaskService aiTaskService;

    public AiTaskEvaluationGateway(AiTaskService aiTaskService) {
        this.aiTaskService = aiTaskService;
    }

    @Override
    public void enqueue(Interview interview) {
        aiTaskService.enqueueAutomaticEvaluation(interview);
    }
}
