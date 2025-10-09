package com.club.management.dto.request;

import com.club.management.entity.CategoriaTransaccion.TipoTransaccion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoriaTransaccionRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    @NotNull(message = "El tipo es obligatorio")
    private TipoTransaccion tipo;

    private String descripcion;

    private Boolean activa = true;
}
