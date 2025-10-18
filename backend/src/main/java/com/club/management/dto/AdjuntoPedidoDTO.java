package com.club.management.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para respuestas de adjuntos de pedidos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjuntoPedidoDTO {

    private Long id;
    private Long pedidoId;
    private String numeroPedido;

    private String nombreArchivo; // Nombre único en el sistema
    private String nombreOriginal; // Nombre original del usuario
    private String tipoArchivo; // FACTURA, ALBARAN, CONTRATO, etc.
    private String mimeType;
    private Long tamanioBytes;
    private String tamanioLegible; // Formato: "1.5 MB", "234 KB", etc.
    private String descripcion;

    // Usuario que subió el archivo
    private Long subidoPorId;
    private String subidoPorNombre;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaSubida;

    // URLs para descarga
    private String urlDescarga; // URL para descargar el archivo
    private String urlVistaPrevia; // URL para vista previa (si aplica)

    // Flags de ayuda
    private Boolean esImagen;
    private Boolean esPdf;
}
