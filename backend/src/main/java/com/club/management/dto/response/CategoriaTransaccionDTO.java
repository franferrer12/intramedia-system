package com.club.management.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CategoriaTransaccionDTO {

    private Long id;
    private String nombre;
    private String tipo;
    private String descripcion;
    private Boolean activa;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
