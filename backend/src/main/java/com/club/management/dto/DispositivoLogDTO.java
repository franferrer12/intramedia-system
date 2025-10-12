package com.club.management.dto;

import com.club.management.entity.DispositivoPOSLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispositivoLogDTO {
    private Long id;
    private Long dispositivoId;
    private DispositivoPOSLog.TipoEvento tipoEvento;
    private String descripcion;
    private Map<String, Object> metadata;
    private Long empleadoId;
    private String empleadoNombre;
    private String ipAddress;
    private LocalDateTime fecha;
}
