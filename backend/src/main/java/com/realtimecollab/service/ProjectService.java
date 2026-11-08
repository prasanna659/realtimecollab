package com.realtimecollab.service;

import com.realtimecollab.dto.*;
import com.realtimecollab.entity.*;
import com.realtimecollab.exception.ApiException;
import com.realtimecollab.mapper.ProjectMapper;
import com.realtimecollab.repository.ProjectRepository;
import com.realtimecollab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final WorkspaceAuthService workspaceAuthService;
    private final ProjectMapper projectMapper;

    @Transactional
    public ProjectDto create(UUID workspaceId, UUID actorId, CreateProjectRequest request) {
        workspaceAuthService.requireMember(workspaceId, actorId);
        Workspace workspace = workspaceAuthService.requireWorkspace(workspaceId);
        User creator = userRepository.findById(actorId).orElseThrow(() -> ApiException.notFound("User not found"));

        Project project = Project.builder()
                .workspace(workspace)
                .name(request.name().trim())
                .description(request.description())
                .color(request.color() != null ? request.color() : "#4C7EA8")
                .status(ProjectStatus.ACTIVE)
                .createdBy(creator)
                .build();
        project = projectRepository.save(project);

        return projectMapper.toDto(project);
    }

    public List<ProjectDto> list(UUID workspaceId, UUID actorId) {
        workspaceAuthService.requireMember(workspaceId, actorId);
        return projectRepository.findAllByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
                .map(projectMapper::toDto)
                .toList();
    }

    public ProjectDto get(UUID projectId, UUID actorId) {
        Project project = requireProject(projectId);
        workspaceAuthService.requireMember(project.getWorkspace().getId(), actorId);
        return projectMapper.toDto(project);
    }

    @Transactional
    public ProjectDto update(UUID projectId, UUID actorId, UpdateProjectRequest request) {
        Project project = requireProject(projectId);
        workspaceAuthService.requireMember(project.getWorkspace().getId(), actorId);

        project.setName(request.name().trim());
        project.setDescription(request.description());
        if (request.color() != null) project.setColor(request.color());
        project = projectRepository.save(project);

        return projectMapper.toDto(project);
    }

    @Transactional
    public ProjectDto setArchived(UUID projectId, UUID actorId, boolean archived) {
        Project project = requireProject(projectId);
        workspaceAuthService.requireMember(project.getWorkspace().getId(), actorId);

        project.setStatus(archived ? ProjectStatus.ARCHIVED : ProjectStatus.ACTIVE);
        project = projectRepository.save(project);

        return projectMapper.toDto(project);
    }

    Project requireProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
    }
}
