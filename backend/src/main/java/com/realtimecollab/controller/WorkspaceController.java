package com.realtimecollab.controller;

import com.realtimecollab.dto.*;
import com.realtimecollab.security.UserPrincipal;
import com.realtimecollab.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    public ResponseEntity<WorkspaceDto> create(@AuthenticationPrincipal UserPrincipal me, @Valid @RequestBody CreateWorkspaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceService.create(me.getId(), request));
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceDto>> list(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(workspaceService.listForUser(me.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceDto> get(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        return ResponseEntity.ok(workspaceService.get(id, me.getId()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<WorkspaceMemberDto>> members(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        return ResponseEntity.ok(workspaceService.listMembers(id, me.getId()));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<WorkspaceMemberDto> invite(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id, @Valid @RequestBody InviteMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workspaceService.inviteMember(id, me.getId(), request));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id, @PathVariable UUID userId) {
        workspaceService.removeMember(id, me.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        workspaceService.leave(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable UUID id) {
        workspaceService.delete(id, me.getId());
        return ResponseEntity.noContent().build();
    }
}
