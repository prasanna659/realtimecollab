package com.realtimecollab.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            "test-secret-key-that-is-long-enough-for-hmac-sha-256-signing",
            15
    );

    @Test
    void generatesAndParsesAValidAccessToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId, "ava@example.com", "MEMBER");

        assertTrue(jwtService.isValid(token));
        assertEquals(userId, jwtService.extractUserId(token));
        assertEquals("ava@example.com", jwtService.parseClaims(token).get("email"));
        assertEquals("MEMBER", jwtService.parseClaims(token).get("role"));
    }

    @Test
    void rejectsATamperedToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId, "ava@example.com", "MEMBER");
        String tampered = token.substring(0, token.length() - 4) + "abcd";

        assertFalse(jwtService.isValid(tampered));
    }
}
