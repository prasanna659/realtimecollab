package com.realtimecollab.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

class TaskStatusTest {

    @Test
    void usesOnlyTheThreeCoreKanbanStatuses() {
        assertArrayEquals(
                new TaskStatus[] { TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE },
                TaskStatus.values()
        );
    }
}
