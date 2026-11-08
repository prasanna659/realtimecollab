package com.realtimecollab.service;

import com.realtimecollab.entity.Project;
import com.realtimecollab.entity.Workspace;
import com.realtimecollab.repository.ProjectRepository;
import com.realtimecollab.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional(readOnly = true)
    public boolean canAccessProject(UUID userId, UUID projectId) {
        return projectRepository.findById(projectId)
                .map(Project::getWorkspace)
                .map(Workspace::getId)
                .map(workspaceId -> workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public Project requireProjectAccess(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        UUID workspaceId = project.getWorkspace() != null ? project.getWorkspace().getId() : null;
        if (workspaceId == null || !workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new SecurityException("User is not authorized to access this project");
        }

        return project;
    }
}
