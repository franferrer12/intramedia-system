package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionVentaDTO {

    private Long id;
    private String codigo;
    private String nombre;
    private String estado;
    private Long empleadoId;
    private String empleadoNombre;
    private BigDecimal valorTotal;
    private BigDecimal totalItems;
    private Integer duracionMinutos;
    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;
    private String notas;
    private String creadoPor;
    private String cerradoPor;
}
