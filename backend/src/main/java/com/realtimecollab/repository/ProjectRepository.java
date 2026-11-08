package com.realtimecollab.repository;

import com.realtimecollab.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findAllByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
    long countByWorkspaceIdAndStatus(UUID workspaceId, com.realtimecollab.entity.ProjectStatus status);
}
