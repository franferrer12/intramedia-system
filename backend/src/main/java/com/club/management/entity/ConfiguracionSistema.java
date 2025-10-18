package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_sistema")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clave", nullable = false, unique = true, length = 100)
    private String clave;

    @Column(name = "valor", nullable = false, columnDefinition = "TEXT")
    private String valor;

    @Column(name = "tipo", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private TipoValor tipo;

    @Column(name = "categoria", nullable = false, length = 50)
    private String categoria;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modificado_por_id")
    private Usuario modificadoPor;

    @Column(name = "fecha_modificacion", nullable = false)
    private LocalDateTime fechaModificacion;

    public enum TipoValor {
        STRING,
        NUMBER,
        BOOLEAN,
        JSON
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        fechaModificacion = LocalDateTime.now();
    }

    // Utility methods for type-safe value access
    public String getValorString() {
        return valor;
    }

    public Integer getValorInteger() {
        if (tipo != TipoValor.NUMBER) {
            throw new IllegalStateException("Configuration value is not a NUMBER: " + clave);
        }
        try {
            return Integer.parseInt(valor);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Invalid NUMBER value for: " + clave, e);
        }
    }

    public Double getValorDouble() {
        if (tipo != TipoValor.NUMBER) {
            throw new IllegalStateException("Configuration value is not a NUMBER: " + clave);
        }
        try {
            return Double.parseDouble(valor);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Invalid NUMBER value for: " + clave, e);
        }
    }

    public Boolean getValorBoolean() {
        if (tipo != TipoValor.BOOLEAN) {
            throw new IllegalStateException("Configuration value is not a BOOLEAN: " + clave);
        }
        return Boolean.parseBoolean(valor);
    }

    // Utility methods for setting typed values
    public void setValorInteger(Integer value) {
        this.tipo = TipoValor.NUMBER;
        this.valor = value.toString();
    }

    public void setValorDouble(Double value) {
        this.tipo = TipoValor.NUMBER;
        this.valor = value.toString();
    }

    public void setValorBoolean(Boolean value) {
        this.tipo = TipoValor.BOOLEAN;
        this.valor = value.toString();
    }
}
