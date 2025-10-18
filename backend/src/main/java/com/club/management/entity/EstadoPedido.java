package com.club.management.entity;

/**
 * Estados del ciclo de vida de un pedido
 */
public enum EstadoPedido {
    BORRADOR("Borrador"),           // Pedido en creación
    ENVIADO("Enviado"),             // Enviado al proveedor
    CONFIRMADO("Confirmado"),       // Confirmado por proveedor
    EN_TRANSITO("En Tránsito"),     // En camino
    RECIBIDO("Recibido"),           // Recibido y procesado completamente
    PARCIAL("Parcial"),             // Recibido parcialmente
    CANCELADO("Cancelado");         // Cancelado

    private final String displayName;

    EstadoPedido(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
