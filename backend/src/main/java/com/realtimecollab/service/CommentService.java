package com.realtimecollab.service;

import com.realtimecollab.dto.*;
import com.realtimecollab.entity.Comment;
import com.realtimecollab.entity.Task;
import com.realtimecollab.entity.User;
import com.realtimecollab.exception.ApiException;
import com.realtimecollab.mapper.CommentMapper;
import com.realtimecollab.repository.CommentRepository;
import com.realtimecollab.repository.UserRepository;
import com.realtimecollab.websocket.BoardEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final WorkspaceAuthService workspaceAuthService;
    private final CommentMapper commentMapper;
    private final BoardEventPublisher boardEventPublisher;

    @Transactional
    public CommentDto create(UUID taskId, UUID actorId, String actorName, CreateCommentRequest request) {
        Task task = taskService.requireTask(taskId);
        workspaceAuthService.requireMember(task.getProject().getWorkspace().getId(), actorId);
        User author = userRepository.findById(actorId).orElseThrow(() -> ApiException.notFound("User not found"));

        Comment comment = Comment.builder().task(task).author(author).content(request.content()).build();
        comment = commentRepository.save(comment);

        CommentDto dto = commentMapper.toDto(comment);
        boardEventPublisher.publish(task.getProject().getId(), new BoardEvent("COMMENT_ADDED", task.getProject().getId(), taskId, dto, actorId, actorName));
        return dto;
    }

    public List<CommentDto> list(UUID taskId, UUID actorId) {
        Task task = taskService.requireTask(taskId);
        workspaceAuthService.requireMember(task.getProject().getWorkspace().getId(), actorId);
        return commentRepository.findAllByTaskIdOrderByCreatedAtAsc(taskId).stream().map(commentMapper::toDto).toList();
    }

    @Transactional
    public void delete(UUID commentId, UUID actorId) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> ApiException.notFound("Comment not found"));
        workspaceAuthService.requireMember(comment.getTask().getProject().getWorkspace().getId(), actorId);
        if (!comment.getAuthor().getId().equals(actorId)) {
            throw ApiException.forbidden("You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }
}
