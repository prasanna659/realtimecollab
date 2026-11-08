package com.realtimecollab.dto;

import com.realtimecollab.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record MoveTaskRequest(
        @NotNull TaskStatus status,
        @NotNull Integer position
) {}
