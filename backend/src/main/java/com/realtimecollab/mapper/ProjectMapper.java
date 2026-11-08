package com.realtimecollab.mapper;

import com.realtimecollab.dto.ProjectDto;
import com.realtimecollab.entity.Project;
import com.realtimecollab.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProjectMapper {

    private final TaskRepository taskRepository;

    public ProjectDto toDto(Project project) {
        long taskCount = taskRepository.countByProjectId(project.getId());
        return new ProjectDto(
                project.getId(),
                project.getWorkspace().getId(),
                project.getName(),
                project.getDescription(),
                project.getColor(),
                project.getStatus(),
                taskCount,
                project.getCreatedAt()
        );
    }
}
