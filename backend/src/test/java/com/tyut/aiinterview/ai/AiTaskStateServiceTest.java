package com.tyut.aiinterview.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tyut.aiinterview.domain.AiTask;
import com.tyut.aiinterview.mapper.AiTaskMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class AiTaskStateServiceTest {

    @Test
    void claimsPendingTaskWithCompareAndSetUpdate() {
        AiTaskMapper mapper = mock(AiTaskMapper.class);
        AiTask task = pendingTask();
        when(mapper.selectById(1L)).thenReturn(task);
        when(mapper.update(any(AiTask.class), any())).thenReturn(1);

        AiTask claimed = new AiTaskStateService(mapper).claimPendingTask(1L);

        assertEquals("RUNNING", claimed.getStatus());
        assertEquals(1, claimed.getAttempts());
        verify(mapper).update(any(AiTask.class), any());
    }

    @Test
    void returnsNullWhenAnotherWorkerAlreadyClaimedTask() {
        AiTaskMapper mapper = mock(AiTaskMapper.class);
        when(mapper.selectById(1L)).thenReturn(pendingTask());
        when(mapper.update(any(AiTask.class), any())).thenReturn(0);

        AiTask claimed = new AiTaskStateService(mapper).claimPendingTask(1L);

        assertNull(claimed);
    }

    @Test
    void schedulesRetryOnlyWhenAttemptsRemain() {
        AiTaskMapper mapper = mock(AiTaskMapper.class);
        AiTask task = pendingTask();
        task.setStatus("RUNNING");
        task.setAttempts(2);
        when(mapper.update(any(AiTask.class), any())).thenReturn(1);

        new AiTaskStateService(mapper).markFailure(task, true, "temporary timeout");

        assertEquals("PENDING", task.getStatus());
        assertEquals("temporary timeout", task.getErrorMessage());
    }

    @Test
    void recoversExpiredRunningTaskWithoutRemainingAttemptsAsFailed() {
        AiTaskMapper mapper = mock(AiTaskMapper.class);
        AiTask task = pendingTask();
        task.setStatus("RUNNING");
        task.setAttempts(3);
        task.setStartedAt(LocalDateTime.now().minusMinutes(3));
        when(mapper.selectList(any())).thenReturn(List.of(task));
        when(mapper.update(any(AiTask.class), any())).thenReturn(1);

        int recovered = new AiTaskStateService(mapper).recoverStaleRunningTasks(LocalDateTime.now().minusMinutes(2));

        assertEquals(1, recovered);
        assertEquals("FAILED", task.getStatus());
    }

    private AiTask pendingTask() {
        AiTask task = new AiTask();
        task.setId(1L);
        task.setStatus("PENDING");
        task.setAttempts(0);
        task.setMaxAttempts(3);
        return task;
    }
}
