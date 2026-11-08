package com.realtimecollab.controller;

import com.realtimecollab.dto.CommentDto;
import com.realtimecollab.dto.CreateCommentRequest;
import com.realtimecollab.security.UserPrincipal;
import com.realtimecollab.service.CommentService;
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
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<CommentDto> create(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID taskId, @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(taskId, me.getId(), me.getUser().getName(), request));
    }

    @GetMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<List<CommentDto>> list(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID taskId) {
        return ResponseEntity.ok(commentService.list(taskId, me.getId()));
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        commentService.delete(id, me.getId());
        return ResponseEntity.noContent().build();
    }
}
