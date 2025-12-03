package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmpleadoDTO {

    private Long id;
    private String nombre;
    private String apellidos;
    private String dni;
    private String email;
    private String telefono;
    private String direccion;
    private String cargo;
    private String departamento;
    private LocalDate fechaAlta;
    private LocalDate fechaBaja;
    private BigDecimal salarioBase;
    private String tipoContrato;
    private String numSeguridadSocial;
    private String cuentaBancaria;
    private Boolean activo;
    private String notas;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
