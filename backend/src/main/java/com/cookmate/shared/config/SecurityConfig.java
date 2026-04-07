package com.cookmate.shared.config;

import com.cookmate.shared.dto.ApiResponse;
import com.cookmate.shared.security.ApiKeyFilter;
import com.cookmate.shared.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ApiKeyFilter apiKeyFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(
            ApiKeyFilter apiKeyFilter,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ObjectMapper objectMapper) {
        this.apiKeyFilter = apiKeyFilter;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(
                        jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(
                        ex ->
                                ex.authenticationEntryPoint(
                                                (req, res, authEx) -> {
                                                    res.setStatus(
                                                            HttpServletResponse.SC_UNAUTHORIZED);
                                                    res.setContentType(
                                                            MediaType.APPLICATION_JSON_VALUE);
                                                    objectMapper.writeValue(
                                                            res.getOutputStream(),
                                                            ApiResponse.error(
                                                                    "UNAUTHORIZED",
                                                                    "Authentication required"));
                                                })
                                        .accessDeniedHandler(
                                                (req, res, accessEx) -> {
                                                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                                    res.setContentType(
                                                            MediaType.APPLICATION_JSON_VALUE);
                                                    objectMapper.writeValue(
                                                            res.getOutputStream(),
                                                            ApiResponse.error(
                                                                    "FORBIDDEN", "Access denied"));
                                                }))
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(
                                                "/api/auth/register",
                                                "/api/auth/login",
                                                "/api/auth/google",
                                                "/api/auth/refresh")
                                        .permitAll()
                                        .requestMatchers("/api/health")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/recipes/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/ingredients/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/collections/**")
                                        .permitAll()
                                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/")
                                        .permitAll()
                                        .requestMatchers("/actuator/**")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
