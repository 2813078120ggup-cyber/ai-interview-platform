package com.tyut.aiinterview.ai;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.domain.AiTask;
import com.tyut.aiinterview.mapper.AiTaskMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists AI task state transitions in short database transactions.  External
 * model calls must never run while the task row is locked.
 */
@Service
public class AiTaskStateService {
    private final AiTaskMapper taskMapper;

    public AiTaskStateService(AiTaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Transactional
    public AiTask claimPendingTask(Long id) {
        AiTask task = taskMapper.selectById(id);
        if (task == null || !"PENDING".equals(task.getStatus())) {
            return null;
        }
        task.setStatus("RUNNING");
        task.setAttempts(task.getAttempts() + 1);
        task.setStartedAt(LocalDateTime.now());
        int updated = taskMapper.update(task, new LambdaQueryWrapper<AiTask>()
                .eq(AiTask::getId, id)
                .eq(AiTask::getStatus, "PENDING"));
        return updated == 1 ? task : null;
    }

    @Transactional
    public void markSuccess(AiTask task, String outputPayload) {
        task.setStatus("SUCCESS");
        task.setOutputPayload(outputPayload);
        task.setFinishedAt(LocalDateTime.now());
        task.setErrorMessage(null);
        taskMapper.update(task, new LambdaQueryWrapper<AiTask>()
                .eq(AiTask::getId, task.getId())
                .eq(AiTask::getStatus, "RUNNING"));
    }

    @Transactional
    public void markFailure(AiTask task, boolean retryable, String errorMessage) {
        boolean retry = retryable && task.getAttempts() < task.getMaxAttempts();
        task.setStatus(retry ? "PENDING" : "FAILED");
        task.setScheduledAt(LocalDateTime.now().plusSeconds(30));
        task.setErrorMessage(errorMessage);
        if (!retry) {
            task.setFinishedAt(LocalDateTime.now());
        }
        taskMapper.update(task, new LambdaQueryWrapper<AiTask>()
                .eq(AiTask::getId, task.getId())
                .eq(AiTask::getStatus, "RUNNING"));
    }

    @Transactional
    public int recoverStaleRunningTasks(LocalDateTime cutoff) {
        List<AiTask> staleTasks = taskMapper.selectList(new LambdaQueryWrapper<AiTask>()
                .eq(AiTask::getStatus, "RUNNING")
                .lt(AiTask::getStartedAt, cutoff)
                .orderByAsc(AiTask::getStartedAt)
                .last("LIMIT 50"));
        int recovered = 0;
        for (AiTask task : staleTasks) {
            boolean retry = task.getAttempts() < task.getMaxAttempts();
            task.setStatus(retry ? "PENDING" : "FAILED");
            task.setScheduledAt(LocalDateTime.now());
            task.setErrorMessage("AI task execution lease expired");
            if (!retry) {
                task.setFinishedAt(LocalDateTime.now());
            }
            recovered += taskMapper.update(task, new LambdaQueryWrapper<AiTask>()
                    .eq(AiTask::getId, task.getId())
                    .eq(AiTask::getStatus, "RUNNING")
                    .lt(AiTask::getStartedAt, cutoff));
        }
        return recovered;
    }
}
