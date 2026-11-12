package com.realtimecollab.config;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Only one project's board topic may be subscribed to; wildcards would leak other teams' events. */
class WebSocketSubscriptionTest {

    @Test
    void acceptsAProjectBoardTopic() {
        UUID id = UUID.randomUUID();
        assertEquals(id, WebSocketConfig.parseBoardProjectId("/topic/projects/" + id + "/board"));
    }

    @Test
    void rejectsWildcardsThatWouldMatchEveryProject() {
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/**"));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/*"));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/projects/**"));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/projects/*/board"));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/projects/**/board"));
    }

    @Test
    void rejectsOtherDestinationsAndMalformedIds() {
        UUID id = UUID.randomUUID();
        assertNull(WebSocketConfig.parseBoardProjectId(null));
        assertNull(WebSocketConfig.parseBoardProjectId(""));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/other"));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/projects/" + id));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/projects/" + id + "/board/extra"));
        assertNull(WebSocketConfig.parseBoardProjectId("/queue/projects/" + id + "/board"));
        assertNull(WebSocketConfig.parseBoardProjectId("/topic/projects/not-a-uuid-not-a-uuid-not-a-uuid-xx/board"));
    }
}
