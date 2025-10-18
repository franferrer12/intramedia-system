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
public class PlantillaPedidoDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private Long proveedorId;
    private String proveedorNombre;
    private JsonNode detalles;
    private String observaciones;
    private Boolean activa;
    private Long creadoPorId;
    private String creadoPorNombre;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
}
