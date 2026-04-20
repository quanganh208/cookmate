package com.cookmate.shared.config;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global MVC tweaks. Caps {@code ?size=} on all pageable endpoints so a client can't force huge
 * scans (e.g. {@code ?size=10000}).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final int MAX_PAGE_SIZE = 50;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        PageableHandlerMethodArgumentResolver resolver =
                new PageableHandlerMethodArgumentResolver();
        resolver.setMaxPageSize(MAX_PAGE_SIZE);
        resolvers.add(resolver);
    }
}
