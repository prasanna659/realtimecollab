package com.realtimecollab.repository;

import com.realtimecollab.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findAllByTaskIdOrderByCreatedAtAsc(UUID taskId);
    long countByTaskId(UUID taskId);
}
