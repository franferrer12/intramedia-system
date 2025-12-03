package com.club.management.dto;

import com.club.management.entity.Venta;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para respuestas de ventas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VentaDTO {

    private Long id;
    private String numeroTicket;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fecha;

    private BigDecimal subtotal;
    private BigDecimal descuento;
    private BigDecimal total;

    private Venta.MetodoPago metodoPago;
    private BigDecimal montoEfectivo;
    private BigDecimal montoTarjeta;

    private Long sesionCajaId;
    private String sesionCajaNombre;

    private Long empleadoId;
    private String empleadoNombre;

    private Long eventoId;
    private String eventoNombre;

    private String clienteNombre;
    private String observaciones;

    private List<DetalleVentaDTO> detalles;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
