package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad que representa un archivo adjunto a un pedido
 */
@Entity
@Table(name = "adjuntos_pedido", indexes = {
    @Index(name = "idx_adjuntos_pedido_pedido_id", columnList = "pedido_id"),
    @Index(name = "idx_adjuntos_pedido_tipo", columnList = "tipo_archivo"),
    @Index(name = "idx_adjuntos_pedido_fecha", columnList = "fecha_subida")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdjuntoPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Column(name = "nombre_archivo", nullable = false, length = 500)
    private String nombreArchivo; // Nombre único en el sistema

    @Column(name = "nombre_original", nullable = false, length = 500)
    private String nombreOriginal; // Nombre original del usuario

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_archivo", nullable = false, length = 100)
    private TipoAdjunto tipoArchivo;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "tamanio_bytes", nullable = false)
    private Long tamanioBytes;

    @Column(name = "ruta_archivo", nullable = false, length = 1000)
    private String rutaArchivo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subido_por_id")
    private Usuario subidoPor;

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;

    /**
     * Enum para tipos de adjuntos
     */
    public enum TipoAdjunto {
        FACTURA,
        ALBARAN,
        CONTRATO,
        PRESUPUESTO,
        NOTA_ENTREGA,
        OTRO
    }

    /**
     * Obtener el tamaño en formato legible
     */
    @Transient
    public String getTamanioLegible() {
        if (tamanioBytes == null) return "0 B";

        if (tamanioBytes < 1024) {
            return tamanioBytes + " B";
        } else if (tamanioBytes < 1024 * 1024) {
            return String.format("%.2f KB", tamanioBytes / 1024.0);
        } else if (tamanioBytes < 1024 * 1024 * 1024) {
            return String.format("%.2f MB", tamanioBytes / (1024.0 * 1024.0));
        } else {
            return String.format("%.2f GB", tamanioBytes / (1024.0 * 1024.0 * 1024.0));
        }
    }

    /**
     * Verificar si el archivo es una imagen
     */
    @Transient
    public Boolean isImagen() {
        if (mimeType == null) return false;
        return mimeType.startsWith("image/");
    }

    /**
     * Verificar si el archivo es un PDF
     */
    @Transient
    public Boolean isPdf() {
        if (mimeType == null) return false;
        return mimeType.equals("application/pdf");
    }
}
