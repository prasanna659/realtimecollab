package com.realtimecollab.service;

import com.realtimecollab.dto.*;
import com.realtimecollab.entity.*;
import com.realtimecollab.exception.ApiException;
import com.realtimecollab.mapper.WorkspaceMapper;
import com.realtimecollab.repository.UserRepository;
import com.realtimecollab.repository.WorkspaceMemberRepository;
import com.realtimecollab.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final WorkspaceAuthService workspaceAuthService;
    private final WorkspaceMapper workspaceMapper;

    @Transactional
    public WorkspaceDto create(UUID ownerId, CreateWorkspaceRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        Workspace workspace = Workspace.builder()
                .name(request.name().trim())
                .owner(owner)
                .build();
        workspace = workspaceRepository.save(workspace);

        WorkspaceMember membership = WorkspaceMember.builder()
                .workspace(workspace)
                .user(owner)
                .role(WorkspaceRole.OWNER)
                .build();
        workspaceMemberRepository.save(membership);

        return workspaceMapper.toDto(workspace, ownerId);
    }

    public List<WorkspaceDto> listForUser(UUID userId) {
        return workspaceRepository.findAllForUser(userId).stream()
                .map(w -> workspaceMapper.toDto(w, userId))
                .toList();
    }

    public WorkspaceDto get(UUID workspaceId, UUID userId) {
        workspaceAuthService.requireMember(workspaceId, userId);
        Workspace workspace = workspaceAuthService.requireWorkspace(workspaceId);
        return workspaceMapper.toDto(workspace, userId);
    }

    public List<WorkspaceMemberDto> listMembers(UUID workspaceId, UUID userId) {
        workspaceAuthService.requireMember(workspaceId, userId);
        return workspaceMemberRepository.findAllByWorkspaceId(workspaceId).stream()
                .map(m -> new WorkspaceMemberDto(m.getUser().getId(), m.getUser().getName(), m.getUser().getEmail(), m.getRole()))
                .toList();
    }

    @Transactional
    public WorkspaceMemberDto inviteMember(UUID workspaceId, UUID actorId, InviteMemberRequest request) {
        workspaceAuthService.requireOwner(workspaceId, actorId);
        Workspace workspace = workspaceAuthService.requireWorkspace(workspaceId);

        User invitee = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> ApiException.notFound(
                        "No RealtimeCollab account found for " + request.email() + " — ask them to register first"));

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, invitee.getId())) {
            throw ApiException.conflict("This person is already a member of the workspace");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(invitee)
                .role(WorkspaceRole.MEMBER)
                .build();
        workspaceMemberRepository.save(member);

        return new WorkspaceMemberDto(invitee.getId(), invitee.getName(), invitee.getEmail(), WorkspaceRole.MEMBER);
    }

    @Transactional
    public void leave(UUID workspaceId, UUID userId) {
        WorkspaceMember member = workspaceAuthService.requireMember(workspaceId, userId);
        if (member.getRole() == WorkspaceRole.OWNER) {
            throw ApiException.forbidden("The owner can't leave — delete the workspace instead");
        }
        workspaceMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, userId);
    }

    @Transactional
    public void removeMember(UUID workspaceId, UUID actorId, UUID targetUserId) {
        workspaceAuthService.requireOwner(workspaceId, actorId);
        if (actorId.equals(targetUserId)) {
            throw ApiException.forbidden("Owners can't remove themselves — delete the workspace instead");
        }
        workspaceMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, targetUserId);
    }

    @Transactional
    public void delete(UUID workspaceId, UUID actorId) {
        workspaceAuthService.requireOwner(workspaceId, actorId);
        workspaceRepository.deleteById(workspaceId);
    }
}
