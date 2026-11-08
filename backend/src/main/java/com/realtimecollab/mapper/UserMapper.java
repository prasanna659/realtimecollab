package com.realtimecollab.mapper;

import com.realtimecollab.dto.UserDto;
import com.realtimecollab.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
