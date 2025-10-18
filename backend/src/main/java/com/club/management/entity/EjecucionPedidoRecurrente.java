package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ejecuciones_pedido_recurrente")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EjecucionPedidoRecurrente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_recurrente_id", nullable = false)
    private PedidoRecurrente pedidoRecurrente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_generado_id")
    private Pedido pedidoGenerado;

    @Column(name = "fecha_ejecucion", nullable = false)
    private LocalDateTime fechaEjecucion;

    @Column(name = "exitoso", nullable = false)
    private Boolean exitoso;

    @Column(name = "mensaje_error", columnDefinition = "TEXT")
    private String mensajeError;

    @PrePersist
    protected void onCreate() {
        if (fechaEjecucion == null) {
            fechaEjecucion = LocalDateTime.now();
        }
        if (exitoso == null) {
            exitoso = true;
        }
    }

    /**
     * Factory method para ejecución exitosa
     */
    public static EjecucionPedidoRecurrente crearExitoso(
            PedidoRecurrente recurrente,
            Pedido pedidoGenerado
    ) {
        return EjecucionPedidoRecurrente.builder()
                .pedidoRecurrente(recurrente)
                .pedidoGenerado(pedidoGenerado)
                .fechaEjecucion(LocalDateTime.now())
                .exitoso(true)
                .build();
    }

    /**
     * Factory method para ejecución fallida
     */
    public static EjecucionPedidoRecurrente crearFallido(
            PedidoRecurrente recurrente,
            String mensajeError
    ) {
        return EjecucionPedidoRecurrente.builder()
                .pedidoRecurrente(recurrente)
                .fechaEjecucion(LocalDateTime.now())
                .exitoso(false)
                .mensajeError(mensajeError)
                .build();
    }
}
