package com.club.management.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoFormData {
    private String codigo;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String unidadMedida;
    private Long proveedorId;
    private BigDecimal precioCompra;
    private BigDecimal precioVenta;
    private BigDecimal stockActual;
    private BigDecimal stockMinimo;
    private BigDecimal stockMaximo;
    private Boolean activo;
    private Boolean perecedero;
    private Integer diasCaducidad;
    private String imagenUrl;
    private String notas;
}
