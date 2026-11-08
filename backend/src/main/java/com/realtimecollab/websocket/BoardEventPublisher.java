package com.realtimecollab.websocket;

import com.realtimecollab.dto.BoardEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class BoardEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(UUID projectId, BoardEvent event) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId + "/board", event);
    }
}
