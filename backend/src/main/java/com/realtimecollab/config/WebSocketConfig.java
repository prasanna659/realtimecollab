package com.realtimecollab.config;

import com.realtimecollab.repository.UserRepository;
import com.realtimecollab.security.JwtService;
import com.realtimecollab.security.UserPrincipal;
import com.realtimecollab.service.ProjectAccessService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ProjectAccessService projectAccessService;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    public WebSocketConfig(JwtService jwtService, UserRepository userRepository, ProjectAccessService projectAccessService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toArray(String[]::new);

        registry
            .addEndpoint("/ws")
            .setAllowedOriginPatterns(origins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthInterceptor());
    }

    @Bean
    public ChannelInterceptor stompAuthInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authorization = accessor.getFirstNativeHeader("Authorization");
                    if (authorization == null || !authorization.startsWith("Bearer ")) {
                        throw new MessageDeliveryException("Missing or invalid Authorization header");
                    }

                    String token = authorization.substring(7);
                    if (!jwtService.isValid(token)) {
                        throw new MessageDeliveryException("Invalid or expired JWT token");
                    }

                    UUID userId = jwtService.extractUserId(token);
                    var user = userRepository.findById(userId)
                            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

                    accessor.setUser(new UserPrincipal(user));
                    if (accessor.getSessionAttributes() != null) {
                        accessor.getSessionAttributes().put("userId", userId);
                    }
                }

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    UUID userId = null;
                    if (accessor.getUser() instanceof UserPrincipal principal) {
                        userId = principal.getId();
                    } else if (accessor.getSessionAttributes() != null && accessor.getSessionAttributes().containsKey("userId")) {
                        userId = UUID.fromString(accessor.getSessionAttributes().get("userId").toString());
                    }

                    if (userId == null) {
                        throw new MessageDeliveryException("Authentication required to subscribe");
                    }

                    String destination = accessor.getDestination();
                    if (destination != null && destination.startsWith("/topic/projects/")) {
                        String[] parts = destination.split("/");
                        if (parts.length >= 5) {
                            try {
                                UUID projectId = UUID.fromString(parts[3]);
                                if (!projectAccessService.canAccessProject(userId, projectId)) {
                                    throw new MessageDeliveryException("You are not authorized to access this project");
                                }
                            } catch (IllegalArgumentException ex) {
                                throw new MessageDeliveryException("Invalid project subscription destination");
                            }
                        }
                    }
                }

                return message;
            }
        };
    }
}
