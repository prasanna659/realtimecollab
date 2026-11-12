package com.realtimecollab.service;

import com.realtimecollab.dto.CreateTaskRequest;
import com.realtimecollab.dto.TaskDto;
import com.realtimecollab.entity.Project;
import com.realtimecollab.entity.ProjectStatus;
import com.realtimecollab.entity.Task;
import com.realtimecollab.entity.TaskPriority;
import com.realtimecollab.entity.TaskStatus;
import com.realtimecollab.entity.User;
import com.realtimecollab.entity.Workspace;
import com.realtimecollab.exception.ApiException;
import com.realtimecollab.mapper.TaskMapper;
import com.realtimecollab.repository.TaskRepository;
import com.realtimecollab.repository.UserRepository;
import com.realtimecollab.websocket.BoardEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectService projectService;
    @Mock private WorkspaceAuthService workspaceAuthService;
    @Mock private TaskMapper taskMapper;
    @Mock private BoardEventPublisher boardEventPublisher;
    @InjectMocks private TaskService taskService;

    private final UUID actorId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();
    private Project project;
    private User actor;

    @BeforeEach
    void setUp() {
        Workspace workspace = new Workspace();
        workspace.setId(workspaceId);
        project = new Project();
        project.setId(projectId);
        project.setWorkspace(workspace);
        project.setStatus(ProjectStatus.ACTIVE);
        actor = new User();
        actor.setId(actorId);
        actor.setName("Alice");

        lenient().when(projectService.requireProject(projectId)).thenReturn(project);
        lenient().when(userRepository.findById(actorId)).thenReturn(Optional.of(actor));
        lenient().when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(taskMapper.toDto(any(Task.class))).thenReturn(mapperResult());
    }

    private TaskDto mapperResult() {
        return new TaskDto(UUID.randomUUID(), projectId, "t", null, TaskStatus.TODO, TaskPriority.MEDIUM,
                0, null, null, 0, null, null);
    }

    private Task existing(TaskStatus status, int position) {
        Task t = new Task();
        t.setId(UUID.randomUUID());
        t.setProject(project);
        t.setStatus(status);
        t.setPosition(position);
        return t;
    }

    @Test
    void createsInTheRequestedColumnAtTheEnd() {
        when(taskRepository.findAllByProjectIdOrderByPositionAsc(projectId))
                .thenReturn(List.of(existing(TaskStatus.TODO, 0), existing(TaskStatus.DONE, 0), existing(TaskStatus.DONE, 1)));

        taskService.create(projectId, actorId, "Alice",
                new CreateTaskRequest("Ship it", null, null, null, null, TaskStatus.DONE));

        ArgumentCaptor<Task> saved = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(saved.capture());
        assertEquals(TaskStatus.DONE, saved.getValue().getStatus());
        assertEquals(2, saved.getValue().getPosition());
    }

    @Test
    void defaultsToTodoWhenNoStatusIsGiven() {
        when(taskRepository.findAllByProjectIdOrderByPositionAsc(projectId)).thenReturn(List.of());

        taskService.create(projectId, actorId, "Alice", new CreateTaskRequest("First", null, null, null, null));

        ArgumentCaptor<Task> saved = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(saved.capture());
        assertEquals(TaskStatus.TODO, saved.getValue().getStatus());
        assertEquals(0, saved.getValue().getPosition());
        assertEquals(TaskPriority.MEDIUM, saved.getValue().getPriority());
    }

    @Test
    void refusesNewTasksInAnArchivedProject() {
        project.setStatus(ProjectStatus.ARCHIVED);

        ApiException ex = assertThrows(ApiException.class, () -> taskService.create(projectId, actorId, "Alice",
                new CreateTaskRequest("Nope", null, null, null, null)));

        assertEquals(409, ex.getStatus().value());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void refusesAnAssigneeWhoIsNotInTheWorkspace() {
        UUID outsider = UUID.randomUUID();
        doThrow(ApiException.badRequest("Assignee must be a member of this workspace"))
                .when(workspaceAuthService).requireAssignable(workspaceId, outsider);

        ApiException ex = assertThrows(ApiException.class, () -> taskService.create(projectId, actorId, "Alice",
                new CreateTaskRequest("Task", null, null, null, outsider)));

        assertEquals(400, ex.getStatus().value());
        verify(taskRepository, never()).save(any());
    }
}
