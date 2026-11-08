package com.realtimecollab.mapper;

import com.realtimecollab.dto.WorkspaceDto;
import com.realtimecollab.entity.Workspace;
import com.realtimecollab.entity.WorkspaceRole;
import com.realtimecollab.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WorkspaceMapper {

    private final WorkspaceMemberRepository workspaceMemberRepository;

    public WorkspaceDto toDto(Workspace workspace, UUID viewerId) {
        WorkspaceRole myRole = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), viewerId)
                .map(m -> m.getRole())
                .orElse(WorkspaceRole.MEMBER);
        long memberCount = workspaceMemberRepository.countByWorkspaceId(workspace.getId());

        return new WorkspaceDto(
                workspace.getId(),
                workspace.getName(),
                workspace.getOwner().getId(),
                myRole,
                memberCount,
                workspace.getCreatedAt()
        );
    }
}
