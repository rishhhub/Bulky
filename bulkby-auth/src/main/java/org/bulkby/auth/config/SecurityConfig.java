package org.bulkby.auth.config;

import org.bulkby.auth.security.JwtAuthenticationFilter;
import org.bulkby.auth.security.RequestResponseLoggingFilter;
import org.bulkby.auth.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Security configuration. All paths are context-relative: server.servlet.context-path is /api,
 * so a request to /api/auth/login is matched as /auth/login.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RequestResponseLoggingFilter requestResponseLoggingFilter;

    @Value("${spring.h2.console.enabled:true}")
    private boolean h2ConsoleEnabled;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173}")
    private String corsAllowedOrigins;

    @Value("${app.security.hsts-enabled:false}")
    private boolean hstsEnabled;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                var builder = auth.requestMatchers("/auth/**").permitAll();
                if (h2ConsoleEnabled) {
                    builder.requestMatchers("/h2-console/**").permitAll();
                }
                builder
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/products/**", "/categories/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/seller/status").authenticated()
                .requestMatchers("/seller/register").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/seller/**").hasAnyRole("SELLER", "ADMIN")
                .requestMatchers("/warehouses", "/warehouses/**").authenticated()
                .requestMatchers("/profile", "/profile/**").authenticated()
                .requestMatchers("/logistics", "/logistics/**").authenticated()
                .requestMatchers("/interests", "/interests/**").authenticated()
                .requestMatchers("/payments", "/payments/**").authenticated()
                .requestMatchers("/wishlist", "/wishlist/**").authenticated()
                .requestMatchers("/direct-order", "/direct-order/**").authenticated()
                .requestMatchers("/tracking", "/tracking/**").authenticated()
                .requestMatchers("/pincodes", "/pincodes/**").authenticated()
                .requestMatchers("/orders", "/orders/**").authenticated()
                .requestMatchers("/reviews", "/reviews/**").authenticated()
                .requestMatchers("/notifications", "/notifications/**").authenticated()
                .anyRequest().authenticated();
            })
            .headers(headers -> {
                var h = headers.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"));
                if (h2ConsoleEnabled) {
                    h = h.frameOptions(frameOptions -> frameOptions.disable());
                }
                if (hstsEnabled) {
                    h = h.httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true).preload(true));
                } else {
                    h = h.httpStrictTransportSecurity(hsts -> hsts.disable());
                }
                h.xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK));
            })
            .authenticationProvider(authenticationProvider())
            // Add logging first, then JWT (both before UsernamePasswordAuthenticationFilter so order is: logging -> JWT -> rest)
            .addFilterBefore(requestResponseLoggingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        if (!origins.isEmpty()) {
            configuration.setAllowedOrigins(origins);
        } else {
            configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"));
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
