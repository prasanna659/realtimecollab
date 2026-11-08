package com.realtimecollab.repository;

import com.realtimecollab.entity.Task;
import com.realtimecollab.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findAllByProjectIdOrderByPositionAsc(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, TaskStatus status);

    @Query("select count(t) from Task t where t.project.workspace.id = :workspaceId")
    long countAllInWorkspace(@Param("workspaceId") UUID workspaceId);

    @Query("select count(t) from Task t where t.project.workspace.id = :workspaceId and t.status = :status")
    long countInWorkspaceByStatus(@Param("workspaceId") UUID workspaceId, @Param("status") TaskStatus status);

    @Query("""
        select count(t) from Task t
        where t.project.workspace.id = :workspaceId
        and t.status <> com.realtimecollab.entity.TaskStatus.DONE
        and t.dueDate < CURRENT_DATE
        """)
    long countOverdue(@Param("workspaceId") UUID workspaceId);

    @Query("""
        select count(t) from Task t
        where t.project.workspace.id = :workspaceId
        and t.status <> com.realtimecollab.entity.TaskStatus.DONE
        and t.dueDate = CURRENT_DATE
        """)
    long countDueToday(@Param("workspaceId") UUID workspaceId);

    @Query("""
        select t from Task t
        where t.project.workspace.id = :workspaceId
        and t.status = com.realtimecollab.entity.TaskStatus.DONE
        and t.updatedAt >= :since
        """)
    List<Task> findCompletedSince(@Param("workspaceId") UUID workspaceId, @Param("since") Instant since);

    long countByProjectId(UUID projectId);
}
