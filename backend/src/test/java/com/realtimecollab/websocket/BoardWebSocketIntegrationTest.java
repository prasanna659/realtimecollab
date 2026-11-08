package com.realtimecollab.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.realtimecollab.dto.AuthResponse;
import com.realtimecollab.dto.CreateProjectRequest;
import com.realtimecollab.dto.CreateTaskRequest;
import com.realtimecollab.dto.CreateWorkspaceRequest;
import com.realtimecollab.dto.TaskDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestClient;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class BoardWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void projectMembersReceiveBoardUpdatesAndNonMembersDoNot() throws Exception {
        String ownerEmail = "owner-ws@example.com";
        String memberEmail = "member-ws@example.com";
        String outsiderEmail = "outsider-ws@example.com";

        String ownerToken = registerAndGetToken("Owner WS", ownerEmail, "Password123");
        String memberToken = registerAndGetToken("Member WS", memberEmail, "Password123");
        String outsiderToken = registerAndGetToken("Outsider WS", outsiderEmail, "Password123");

        UUID workspaceId = createWorkspace(ownerToken, "Realtime Board Workspace");
        createWorkspaceMembership(ownerToken, workspaceId, memberEmail);

        UUID projectId = createProject(ownerToken, workspaceId, "Realtime Board");

        BlockingQueue<String> memberQueue = new LinkedBlockingQueue<>();
        BlockingQueue<String> outsiderQueue = new LinkedBlockingQueue<>();

        WebSocketStompClient memberClient = new WebSocketStompClient(new StandardWebSocketClient());
        memberClient.setMessageConverter(new MappingJackson2MessageConverter());
        StompHeaders memberConnectHeaders = new StompHeaders();
        memberConnectHeaders.add("Authorization", "Bearer " + memberToken);
        StompSession memberSession = memberClient.connect("ws://localhost:" + port + "/ws",
                new WebSocketHttpHeaders(),
                memberConnectHeaders,
                new StompSessionHandlerAdapter() {
                },
                10000).get(10, TimeUnit.SECONDS);
        memberSession.subscribe("/topic/projects/" + projectId + "/board", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return byte[].class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                memberQueue.add(new String((byte[]) payload));
            }
        });
        Thread.sleep(2000);

        WebSocketStompClient outsiderClient = new WebSocketStompClient(new StandardWebSocketClient());
        outsiderClient.setMessageConverter(new MappingJackson2MessageConverter());
        StompHeaders outsiderConnectHeaders = new StompHeaders();
        outsiderConnectHeaders.add("Authorization", "Bearer " + outsiderToken);
        StompSession outsiderSession = outsiderClient.connect("ws://localhost:" + port + "/ws",
                new WebSocketHttpHeaders(),
                outsiderConnectHeaders,
                new StompSessionHandlerAdapter() {
                },
                10000).get(10, TimeUnit.SECONDS);

        outsiderSession.subscribe("/topic/projects/" + projectId + "/board", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return byte[].class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                outsiderQueue.add(new String((byte[]) payload));
            }
        });

        TaskDto created = createTask(ownerToken, projectId, "Board task");
        String boardPayload = memberQueue.poll(20, TimeUnit.SECONDS);

        assertThat(boardPayload).isNotNull();
        assertThat(boardPayload).contains("TASK_CREATED");
        assertThat(boardPayload).contains("Board task");
        assertThat(outsiderQueue.poll(2, TimeUnit.SECONDS)).isNull();
        assertThat(created.title()).isEqualTo("Board task");

        if (memberSession.isConnected()) {
            memberSession.disconnect();
        }
        if (outsiderSession.isConnected()) {
            outsiderSession.disconnect();
        }
        memberClient.stop();
        outsiderClient.stop();
    }

    private String registerAndGetToken(String name, String email, String password) {
        RestClient client = RestClient.builder().baseUrl("http://localhost:" + port).build();
        var response = client.post()
                .uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"name\":\"" + name + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")
                .retrieve()
                .body(AuthResponse.class);
        return response.accessToken();
    }

    private UUID createWorkspace(String token, String name) {
        RestClient client = RestClient.builder().baseUrl("http://localhost:" + port).build();
        var response = client.post()
                .uri("/api/workspaces")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreateWorkspaceRequest(name))
                .retrieve()
                .body(com.realtimecollab.dto.WorkspaceDto.class);
        return response.id();
    }

    private void createWorkspaceMembership(String ownerToken, UUID workspaceId, String memberEmail) {
        RestClient client = RestClient.builder().baseUrl("http://localhost:" + port).build();
        client.post()
                .uri("/api/workspaces/{id}/members", workspaceId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"email\":\"" + memberEmail + "\"}")
                .retrieve()
                .toBodilessEntity();
    }

    private UUID createProject(String token, UUID workspaceId, String name) {
        RestClient client = RestClient.builder().baseUrl("http://localhost:" + port).build();
        var response = client.post()
                .uri("/api/workspaces/{workspaceId}/projects", workspaceId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreateProjectRequest(name, "", "#4C7EA8"))
                .retrieve()
                .body(com.realtimecollab.dto.ProjectDto.class);
        return response.id();
    }

    private TaskDto createTask(String token, UUID projectId, String title) {
        RestClient client = RestClient.builder().baseUrl("http://localhost:" + port).build();
        return client.post()
                .uri("/api/projects/{projectId}/tasks", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreateTaskRequest(title, null, null, null, null))
                .retrieve()
                .body(TaskDto.class);
    }
}
