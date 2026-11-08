package com.realtimecollab.dto;

import java.util.UUID;

public record BoardEvent(
        String type,          // TASK_CREATED | TASK_UPDATED | TASK_MOVED | TASK_DELETED | COMMENT_ADDED
        UUID projectId,
        UUID taskId,
        Object payload,
        UUID actorId,
        String actorName
) {}
