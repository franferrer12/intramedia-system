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

    // Campos para modelo de ocio nocturno
    private BigDecimal capacidadMl;
    private String tipoVenta;
    private BigDecimal mlPorServicio;
    private BigDecimal factorMerma;

    // Campos para sistema de venta dual (Copa + Botella VIP)
    private Boolean esVentaDual;
    private Integer copasPorBotella;
    private BigDecimal precioCopa;
    private BigDecimal precioBotellaVip;
}
