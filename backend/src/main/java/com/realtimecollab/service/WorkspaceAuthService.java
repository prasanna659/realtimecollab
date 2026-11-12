package com.realtimecollab.service;

import com.realtimecollab.entity.Workspace;
import com.realtimecollab.entity.WorkspaceMember;
import com.realtimecollab.entity.WorkspaceRole;
import com.realtimecollab.exception.ApiException;
import com.realtimecollab.repository.WorkspaceMemberRepository;
import com.realtimecollab.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkspaceAuthService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public Workspace requireWorkspace(UUID workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> ApiException.notFound("Workspace not found"));
    }

    /** Any member (owner or member) may view/manage tasks and view projects. */
    public WorkspaceMember requireMember(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> ApiException.forbidden("You are not a member of this workspace"));
    }

    /** Only the owner may manage members or delete the workspace. */
    public void requireOwner(UUID workspaceId, UUID userId) {
        WorkspaceMember member = requireMember(workspaceId, userId);
        if (member.getRole() != WorkspaceRole.OWNER) {
            throw ApiException.forbidden("Only the workspace owner can perform this action");
        }
    }

    /** A task may only be assigned to someone who belongs to the task's workspace. */
    public void requireAssignable(UUID workspaceId, UUID assigneeId) {
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, assigneeId)) {
            throw ApiException.badRequest("Assignee must be a member of this workspace");
        }
    }
}
