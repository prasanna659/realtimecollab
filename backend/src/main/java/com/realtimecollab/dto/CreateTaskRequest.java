package com.realtimecollab.dto;

import com.realtimecollab.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        String description,
        TaskPriority priority,
        LocalDate dueDate,
        UUID assigneeId
) {}
