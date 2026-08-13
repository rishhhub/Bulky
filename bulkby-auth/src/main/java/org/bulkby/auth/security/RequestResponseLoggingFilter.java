package org.bulkby.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Logs every API request and response (method, path, status, and principal if authenticated).
 * Helps debug 403/401 by seeing exactly which endpoint was hit and what was returned.
 */
@Component
public class RequestResponseLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestResponseLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String method = request.getMethod();
        String requestUri = request.getRequestURI();
        String queryString = request.getQueryString();
        String path = queryString != null ? requestUri + "?" + queryString : requestUri;

        logger.info("API Request: {} {}", method, path);

        filterChain.doFilter(request, response);

        int status = response.getStatus();
        String principalAfter = null;
        Authentication authAfter = SecurityContextHolder.getContext().getAuthentication();
        if (authAfter != null && authAfter.isAuthenticated() && authAfter.getPrincipal() != null
                && !"anonymousUser".equals(authAfter.getPrincipal().toString())) {
            principalAfter = authAfter.getName();
        }
        if (status >= 400) {
            logger.warn("API Response: {} {} -> {} principal={}", method, path, status, principalAfter != null ? principalAfter : "anonymous");
        } else {
            logger.info("API Response: {} {} -> {} principal={}", method, path, status, principalAfter != null ? principalAfter : "anonymous");
        }
    }
}
