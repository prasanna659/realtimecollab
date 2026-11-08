package com.realtimecollab.mapper;

import com.realtimecollab.dto.TaskDto;
import com.realtimecollab.dto.UserDto;
import com.realtimecollab.entity.Task;
import com.realtimecollab.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TaskMapper {

    private final UserMapper userMapper;
    private final CommentRepository commentRepository;

    public TaskDto toDto(Task task) {
        UserDto assignee = task.getAssignee() != null ? userMapper.toDto(task.getAssignee()) : null;
        long comments = commentRepository.countByTaskId(task.getId());

        return new TaskDto(
                task.getId(),
                task.getProject().getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getPosition(),
                task.getDueDate(),
                assignee,
                comments,
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
