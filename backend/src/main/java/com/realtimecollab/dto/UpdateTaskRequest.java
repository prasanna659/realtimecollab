package com.realtimecollab.dto;

import com.realtimecollab.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        TaskPriority priority,
        LocalDate dueDate,
        UUID assigneeId
) {}
