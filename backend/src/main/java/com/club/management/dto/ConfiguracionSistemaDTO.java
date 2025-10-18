package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionSistemaDTO {
    private Long id;
    private String clave;
    private String valor;
    private String tipo;
    private String categoria;
    private String descripcion;
    private Long modificadoPorId;
    private String modificadoPorNombre;
    private LocalDateTime fechaModificacion;
}
