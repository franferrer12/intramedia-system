package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String unidadMedida;
    private Long proveedorId;
    private String proveedorNombre;
    private BigDecimal precioCompra;
    private BigDecimal precioVenta;
    private BigDecimal margenBeneficio;
    private BigDecimal stockActual;
    private BigDecimal stockMinimo;
    private BigDecimal stockMaximo;
    private Boolean activo;
    private Boolean perecedero;
    private Integer diasCaducidad;
    private String imagenUrl;
    private Boolean bajoStock;
    private Boolean sinStock;
    private String notas;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
