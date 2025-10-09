package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para Usuario (respuesta)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {

    private Long id;
    private String username;
    private String email;
    private String rol;
    private Boolean activo;
    private LocalDateTime ultimoAcceso;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
