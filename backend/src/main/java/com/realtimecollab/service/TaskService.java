package com.realtimecollab.service;

import com.realtimecollab.dto.*;
import com.realtimecollab.entity.*;
import com.realtimecollab.exception.ApiException;
import com.realtimecollab.mapper.TaskMapper;
import com.realtimecollab.repository.TaskRepository;
import com.realtimecollab.repository.UserRepository;
import com.realtimecollab.security.UserPrincipal;
import com.realtimecollab.websocket.BoardEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final WorkspaceAuthService workspaceAuthService;
    private final TaskMapper taskMapper;
    private final BoardEventPublisher boardEventPublisher;

    @Transactional
    public TaskDto create(UUID projectId, UUID actorId, String actorName, CreateTaskRequest request) {
        Project project = projectService.requireProject(projectId);
        workspaceAuthService.requireMember(project.getWorkspace().getId(), actorId);

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw ApiException.conflict("This project is archived. Restore it to add tasks.");
        }

        User creator = userRepository.findById(actorId).orElseThrow(() -> ApiException.notFound("User not found"));
        User assignee = resolveAssignee(project.getWorkspace().getId(), request.assigneeId());

        TaskStatus status = request.status() != null ? request.status() : TaskStatus.TODO;
        int nextPosition = taskRepository.findAllByProjectIdOrderByPositionAsc(projectId).stream()
                .filter(t -> t.getStatus() == status)
                .mapToInt(Task::getPosition).max().orElse(-1) + 1;

        Task task = Task.builder()
                .project(project)
                .title(request.title().trim())
                .description(request.description())
                .status(status)
                .priority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM)
                .position(nextPosition)
                .dueDate(request.dueDate())
                .assignee(assignee)
                .createdBy(creator)
                .updatedBy(creator)
                .build();

        task = taskRepository.save(task);

        TaskDto dto = taskMapper.toDto(task);
        boardEventPublisher.publish(projectId, new BoardEvent("TASK_CREATED", projectId, task.getId(), dto, actorId, actorName));
        return dto;
    }

    public List<TaskDto> listForProject(UUID projectId, UUID actorId) {
        Project project = projectService.requireProject(projectId);
        workspaceAuthService.requireMember(project.getWorkspace().getId(), actorId);

        return taskRepository.findAllByProjectIdOrderByPositionAsc(projectId).stream()
                .map(taskMapper::toDto)
                .toList();
    }

    @Transactional
    public TaskDto update(UUID taskId, UUID actorId, String actorName, UpdateTaskRequest request) {
        Task task = requireTask(taskId);
        workspaceAuthService.requireMember(task.getProject().getWorkspace().getId(), actorId);

        User updater = userRepository.findById(actorId).orElseThrow(() -> ApiException.notFound("User not found"));
        User assignee = resolveAssignee(task.getProject().getWorkspace().getId(), request.assigneeId());

        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        if (request.priority() != null) task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        task.setAssignee(assignee);
        task.setUpdatedBy(updater);

        task = taskRepository.save(task);

        TaskDto dto = taskMapper.toDto(task);
        boardEventPublisher.publish(task.getProject().getId(), new BoardEvent("TASK_UPDATED", task.getProject().getId(), task.getId(), dto, actorId, actorName));
        return dto;
    }

    /** Drag-and-drop: move a task to a new column/position, shifting siblings as needed. */
    @Transactional
    public TaskDto move(UUID taskId, UUID actorId, String actorName, MoveTaskRequest request) {
        Task task = requireTask(taskId);
        workspaceAuthService.requireMember(task.getProject().getWorkspace().getId(), actorId);

        UUID projectId = task.getProject().getId();
        TaskStatus originalStatus = task.getStatus();

        List<Task> tasksInProject = taskRepository.findAllByProjectIdOrderByPositionAsc(projectId);
        List<Task> targetColumn = tasksInProject.stream()
                .filter(t -> t.getStatus() == request.status() && !t.getId().equals(taskId))
                .sorted(Comparator.comparingInt(Task::getPosition))
                .toList();

        int insertAt = Math.max(0, Math.min(request.position(), targetColumn.size()));
        List<Task> reordered = new java.util.ArrayList<>(targetColumn);
        reordered.add(insertAt, task);

        for (int i = 0; i < reordered.size(); i++) {
            Task current = reordered.get(i);
            if (current.getId().equals(taskId)) {
                current.setStatus(request.status());
            }
            current.setPosition(i);
            taskRepository.save(current);
        }

        List<Task> remainingSourceTasks = tasksInProject.stream()
                .filter(t -> t.getStatus() == originalStatus && !t.getId().equals(taskId))
                .sorted(Comparator.comparingInt(Task::getPosition))
                .toList();

        for (int i = 0; i < remainingSourceTasks.size(); i++) {
            Task current = remainingSourceTasks.get(i);
            current.setPosition(i);
            taskRepository.save(current);
        }

        task = taskRepository.findById(taskId).orElse(task);
        TaskDto dto = taskMapper.toDto(task);
        boardEventPublisher.publish(projectId, new BoardEvent("TASK_MOVED", projectId, task.getId(), dto, actorId, actorName));
        return dto;
    }

    @Transactional
    public void delete(UUID taskId, UUID actorId, String actorName) {
        Task task = requireTask(taskId);
        workspaceAuthService.requireMember(task.getProject().getWorkspace().getId(), actorId);

        taskRepository.delete(task);
        boardEventPublisher.publish(task.getProject().getId(), new BoardEvent("TASK_DELETED", task.getProject().getId(), task.getId(), null, actorId, actorName));
    }

    /** Null means unassigned. Anyone else must belong to the workspace. */
    private User resolveAssignee(UUID workspaceId, UUID assigneeId) {
        if (assigneeId == null) return null;
        workspaceAuthService.requireAssignable(workspaceId, assigneeId);
        return userRepository.findById(assigneeId)
                .orElseThrow(() -> ApiException.notFound("Assignee not found"));
    }

    Task requireTask(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> ApiException.notFound("Task not found"));
    }

    public static UUID currentUserId(UserPrincipal principal) {
        return principal.getId();
    }
}
