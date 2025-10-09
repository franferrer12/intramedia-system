package com.club.management.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para la página de inicio
 */
@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("application", "Club Management System");
        response.put("version", "0.1.0");
        response.put("status", "online");
        response.put("apiDocs", "/swagger-ui/index.html");
        response.put("health", "/actuator/health");
        response.put("loginEndpoint", "/api/auth/login");

        return ResponseEntity.ok(response);
    }
}
