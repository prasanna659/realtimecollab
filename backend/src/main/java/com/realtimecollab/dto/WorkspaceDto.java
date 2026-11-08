package com.realtimecollab.dto;

import com.realtimecollab.entity.WorkspaceRole;

import java.time.Instant;
import java.util.UUID;

public record WorkspaceDto(
        UUID id,
        String name,
        UUID ownerId,
        WorkspaceRole myRole,
        long memberCount,
        Instant createdAt
) {}
