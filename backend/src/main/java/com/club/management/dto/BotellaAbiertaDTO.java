package com.club.management.dto;

import com.club.management.entity.BotellaAbierta.EstadoBotella;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para respuestas de botellas abiertas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotellaAbiertaDTO {

    private Long id;

    // Información del producto
    private Long productoId;
    private String productoNombre;
    private String productoCategoria;
    private BigDecimal precioCopa;

    // Sesión de caja
    private Long sesionCajaId;

    // Ubicación
    private String ubicacion;

    // Tracking de copas
    private Integer copasTotales;
    private Integer copasServidas;
    private Integer copasRestantes;
    private Double porcentajeConsumido;

    // Control temporal
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaApertura;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCierre;

    private Long horasAbierta;

    // Estado
    private EstadoBotella estado;

    // Empleados
    private Long abiertaPorId;
    private String abiertaPorNombre;
    private Long cerradaPorId;
    private String cerradaPorNombre;

    // Cálculos financieros
    private BigDecimal ingresosGenerados;
    private BigDecimal ingresosPotencialesPerdidos;

    // Alertas
    private String alerta;  // VACÍA, CASI_VACÍA, ABIERTA_MAS_24H

    // Metadatos
    private String notas;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    // Flags de ayuda
    private Boolean isCasiVacia;
    private Boolean isVacia;
    private Boolean isAbiertaMas24Horas;
}
