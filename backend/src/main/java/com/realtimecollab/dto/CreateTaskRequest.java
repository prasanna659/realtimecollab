package com.realtimecollab.dto;

import com.realtimecollab.entity.TaskPriority;
import com.realtimecollab.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        TaskPriority priority,
        LocalDate dueDate,
        UUID assigneeId,
        /** Optional. Defaults to TODO. Lets the UI create a task directly in the column it was added to. */
        TaskStatus status
) {
    /** Keeps the original five-argument form working for existing callers and tests. */
    public CreateTaskRequest(String title, String description, TaskPriority priority, LocalDate dueDate, UUID assigneeId) {
        this(title, description, priority, dueDate, assigneeId, null);
    }
}
