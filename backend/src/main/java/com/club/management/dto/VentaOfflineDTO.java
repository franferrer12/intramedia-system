package com.club.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentaOfflineDTO {

    @NotBlank(message = "El UUID de la venta es obligatorio")
    private String uuidVenta;

    @NotNull(message = "Los datos de la venta son obligatorios")
    private Map<String, Object> datosVenta;

    private String fechaCreacionLocal; // Timestamp local cuando se creó offline

    private Long sesionCajaId;
}
