package com.realtimecollab.dto;

import com.realtimecollab.entity.TaskPriority;
import com.realtimecollab.entity.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TaskDto(
        UUID id,
        UUID projectId,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        int position,
        LocalDate dueDate,
        UserDto assignee,
        long commentCount,
        Instant createdAt,
        Instant updatedAt
) {}
