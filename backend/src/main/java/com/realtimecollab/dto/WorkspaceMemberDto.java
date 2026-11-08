package com.realtimecollab.dto;

import com.realtimecollab.entity.WorkspaceRole;

import java.util.UUID;

public record WorkspaceMemberDto(
        UUID userId,
        String name,
        String email,
        WorkspaceRole role
) {}
