package com.realtimecollab.dto;

import com.realtimecollab.entity.Role;

import java.util.UUID;

public record UserDto(
        UUID id,
        String name,
        String email,
        Role role
) {}
