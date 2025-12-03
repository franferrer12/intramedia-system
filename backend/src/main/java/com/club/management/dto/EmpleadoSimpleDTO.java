package com.club.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmpleadoSimpleDTO {
    private Long id;
    private String nombre;
    private String apellido;
    private String iniciales;
    private String puesto;
    private Boolean activo;
}
