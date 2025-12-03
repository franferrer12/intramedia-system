package com.club.management.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmpleadoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 150, message = "Los apellidos no pueden exceder 150 caracteres")
    private String apellidos;

    @NotBlank(message = "El DNI es obligatorio")
    @Size(max = 20, message = "El DNI no puede exceder 20 caracteres")
    private String dni;

    @Email(message = "El email debe ser válido")
    @Size(max = 100, message = "El email no puede exceder 100 caracteres")
    private String email;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefono;

    private String direccion;

    @NotBlank(message = "El cargo es obligatorio")
    @Size(max = 100, message = "El cargo no puede exceder 100 caracteres")
    private String cargo;

    @Size(max = 50, message = "El departamento no puede exceder 50 caracteres")
    private String departamento;

    @NotNull(message = "La fecha de alta es obligatoria")
    private LocalDate fechaAlta;

    private LocalDate fechaBaja;

    @NotNull(message = "El salario base es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El salario base debe ser mayor o igual a 0")
    private BigDecimal salarioBase;

    @Size(max = 50, message = "El tipo de contrato no puede exceder 50 caracteres")
    private String tipoContrato;

    @Size(max = 50, message = "El número de seguridad social no puede exceder 50 caracteres")
    private String numSeguridadSocial;

    @Size(max = 34, message = "La cuenta bancaria no puede exceder 34 caracteres")
    private String cuentaBancaria;

    private Boolean activo = true;

    private String notas;
}
