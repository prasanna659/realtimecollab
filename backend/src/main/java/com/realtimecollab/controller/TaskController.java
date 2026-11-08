package com.realtimecollab.controller;

import com.realtimecollab.dto.*;
import com.realtimecollab.security.UserPrincipal;
import com.realtimecollab.service.TaskService;
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
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<TaskDto> create(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID projectId, @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(projectId, me.getId(), me.getUser().getName(), request));
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskDto>> list(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID projectId) {
        return ResponseEntity.ok(taskService.listForProject(projectId, me.getId()));
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<TaskDto> update(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id, @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(taskService.update(id, me.getId(), me.getUser().getName(), request));
    }

    @PatchMapping("/api/tasks/{id}/move")
    public ResponseEntity<TaskDto> move(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id, @Valid @RequestBody MoveTaskRequest request) {
        return ResponseEntity.ok(taskService.move(id, me.getId(), me.getUser().getName(), request));
    }

    @DeleteMapping("/api/tasks/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        taskService.delete(id, me.getId(), me.getUser().getName());
        return ResponseEntity.noContent().build();
    }
}
