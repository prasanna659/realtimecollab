package com.realtimecollab.controller;

import com.realtimecollab.dto.*;
import com.realtimecollab.security.UserPrincipal;
import com.realtimecollab.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping("/api/workspaces/{workspaceId}/projects")
    public ResponseEntity<ProjectDto> create(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID workspaceId, @Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(workspaceId, me.getId(), request));
    }

    @GetMapping("/api/workspaces/{workspaceId}/projects")
    public ResponseEntity<List<ProjectDto>> list(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID workspaceId) {
        return ResponseEntity.ok(projectService.list(workspaceId, me.getId()));
    }

    @GetMapping("/api/projects/{id}")
    public ResponseEntity<ProjectDto> get(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        return ResponseEntity.ok(projectService.get(id, me.getId()));
    }

    @PutMapping("/api/projects/{id}")
    public ResponseEntity<ProjectDto> update(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id, @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.update(id, me.getId(), request));
    }

    @PostMapping("/api/projects/{id}/archive")
    public ResponseEntity<ProjectDto> archive(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        return ResponseEntity.ok(projectService.setArchived(id, me.getId(), true));
    }

    @PostMapping("/api/projects/{id}/restore")
    public ResponseEntity<ProjectDto> restore(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        return ResponseEntity.ok(projectService.setArchived(id, me.getId(), false));
    }
}
