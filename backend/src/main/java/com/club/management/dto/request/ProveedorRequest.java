package com.club.management.dto.request;

import com.club.management.entity.Proveedor.TipoProveedor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para crear/actualizar Proveedor
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El contacto es obligatorio")
    private String contacto;

    private String telefono;

    @Email(message = "Debe ser un email válido")
    private String email;

    private String direccion;

    @NotNull(message = "El tipo es obligatorio")
    private TipoProveedor tipo;

    private Boolean activo;
}
