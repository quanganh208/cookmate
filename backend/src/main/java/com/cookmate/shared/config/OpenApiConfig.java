package com.cookmate.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI cookmateOpenAPI() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("Cookmate API")
                                .description("Backend API for Cookmate recipe sharing app")
                                .version("0.0.1"))
                .addSecurityItem(new SecurityRequirement().addList("X-API-Key").addList("Bearer"))
                .components(
                        new Components()
                                .addSecuritySchemes(
                                        "X-API-Key",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.APIKEY)
                                                .in(SecurityScheme.In.HEADER)
                                                .name("X-API-Key"))
                                .addSecuritySchemes(
                                        "Bearer",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")));
    }
}
