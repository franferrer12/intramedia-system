package com.club.management.dto;

import com.club.management.entity.DispositivoPOS;
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
public class DispositivoPOSDTO {
    private Long id;
    private String uuid;
    private String nombre;
    private String descripcion;
    private DispositivoPOS.TipoDispositivo tipo;
    private String ubicacion;
    private Long empleadoAsignadoId;
    private String empleadoAsignadoNombre;
    private String[] categoriasPredeterminadas;
    private Map<String, Object> configImpresora;
    private Boolean tieneLectorBarras;
    private Boolean tieneCajonDinero;
    private Boolean tienePantallaCliente;
    private Map<String, Object> permisos;
    private Boolean activo;
    private Boolean modoOfflineHabilitado;
    private Boolean modoTabletCompartida;
    private Boolean asignacionPermanente; // false = vinculación temporal (quick start), true = permanente
    private LocalDateTime ultimaConexion;
    private LocalDateTime ultimaSincronizacion;
    private String ipAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
