package com.vaultivo.config;

import com.vaultivo.ratelimit.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * RateLimitFilter is also a @Component (for constructor injection), but
 * Spring Boot skips its default auto-registration once it sees an explicit
 * FilterRegistrationBean for the same filter bean here — no double
 * registration. HIGHEST_PRECEDENCE ensures rate limiting runs before
 * Spring Security's filter chain, so a limited-out request never reaches
 * JWT/OAuth2 processing at all.
 */
@Configuration
@RequiredArgsConstructor
public class RateLimitFilterConfig {

    private final RateLimitFilter rateLimitFilter;

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration() {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(rateLimitFilter);
        registration.addUrlPatterns("/api/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
