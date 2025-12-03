package com.club.management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Aplicación principal del Sistema de Gestión de Discoteca
 *
 * Sistema integral que incluye:
 * - Gestión de eventos
 * - Gestión financiera (gastos e ingresos)
 * - Gestión de personal y nóminas
 * - Inventario y compras
 * - Analytics y reportes
 * - Sistema automático de alertas de stock
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableCaching
public class ClubManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClubManagementApplication.class, args);
    }
}
