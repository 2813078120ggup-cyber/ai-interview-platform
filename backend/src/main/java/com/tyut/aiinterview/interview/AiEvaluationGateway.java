package com.tyut.aiinterview.interview;

import com.tyut.aiinterview.domain.Interview;

public interface AiEvaluationGateway {
    void enqueue(Interview interview);
}
