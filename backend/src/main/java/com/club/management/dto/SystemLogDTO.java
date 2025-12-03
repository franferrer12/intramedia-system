package com.club.management.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogDTO {
    private Long id;
    private String nivel;
    private String modulo;
    private String accion;
    private String mensaje;
    private JsonNode detalles;
    private Long usuarioId;
    private String usuarioNombre;
    private String ipAddress;
    private String userAgent;
    private String stackTrace;
    private LocalDateTime fechaHora;
}
