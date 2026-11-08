package com.realtimecollab.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UUID taskId,
        UserDto author,
        String content,
        Instant createdAt,
        Instant updatedAt
) {}
