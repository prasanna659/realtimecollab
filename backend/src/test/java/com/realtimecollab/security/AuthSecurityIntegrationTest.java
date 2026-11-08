package com.realtimecollab.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.realtimecollab.dto.AuthResponse;
import com.realtimecollab.dto.CreateWorkspaceRequest;
import com.realtimecollab.dto.InviteMemberRequest;
import com.realtimecollab.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerLoginRefreshAndAccessProtectedEndpoint() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("Alice Example", "alice@example.com", "Password123");

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(registerResult.getResponse().getContentAsString(), AuthResponse.class);
        assertThat(auth.accessToken()).isNotBlank();
        assertThat(auth.refreshToken()).isNotBlank();

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + auth.refreshToken() + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse refreshed = objectMapper.readValue(refreshResult.getResponse().getContentAsString(), AuthResponse.class);
        assertThat(refreshed.accessToken()).isNotBlank();
        assertThat(refreshed.refreshToken()).isNotBlank();

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + refreshed.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"));

        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshed.refreshToken() + "\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void protectedEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void workspaceAccessIsRestrictedToMembers() throws Exception {
        String ownerEmail = "owner@example.com";
        String memberEmail = "member@example.com";

        String ownerToken = registerAndGetToken("Owner User", ownerEmail, "Password123");
        String memberToken = registerAndGetToken("Member User", memberEmail, "Password123");

        UUID workspaceId = createWorkspaceViaApi(ownerToken, "Team workspace");

        mockMvc.perform(get("/api/workspaces/{id}", workspaceId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(post("/api/workspaces/{id}/members", workspaceId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new InviteMemberRequest(memberEmail))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/workspaces/{id}", workspaceId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Team workspace"));

        UUID randomWorkspaceId = UUID.randomUUID();
        mockMvc.perform(get("/api/workspaces/{id}", randomWorkspaceId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden());
    }

    private String registerAndGetToken(String name, String email, String password) throws Exception {
        RegisterRequest request = new RegisterRequest(name, email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        return auth.accessToken();
    }

    private UUID createWorkspaceViaApi(String ownerToken, String name) throws Exception {
        MvcResult response = mockMvc.perform(post("/api/workspaces")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateWorkspaceRequest(name))))
                .andExpect(status().isCreated())
                .andReturn();

        String json = response.getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(json).get("id").asText());
    }
}
