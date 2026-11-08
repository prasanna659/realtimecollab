package com.realtimecollab.dto;

import com.realtimecollab.entity.ProjectStatus;

import java.time.Instant;
import java.util.UUID;

public record ProjectDto(
        UUID id,
        UUID workspaceId,
        String name,
        String description,
        String color,
        ProjectStatus status,
        long taskCount,
        Instant createdAt
) {}
