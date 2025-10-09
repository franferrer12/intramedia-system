# Sistema POS (Point of Sale) - Especificación Completa

## Resumen
Sistema para registrar consumos en tiempo real durante sesiones de venta sin gestión de pagos. Los pagos se realizan por TPV físico o efectivo de forma independiente.

---

## 1. Modelo de Base de Datos

### 1.1. Tabla `sesiones_venta`

```sql
CREATE TABLE sesiones_venta (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    -- Relaciones
    empleado_id BIGINT REFERENCES empleados(id),
    evento_id BIGINT REFERENCES eventos(id),

    -- Control de sesión
    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',

    -- Totales calculados
    total_consumos INTEGER DEFAULT 0,
    total_items DECIMAL(10,2) DEFAULT 0.00,
    valor_total DECIMAL(10,2) DEFAULT 0.00,

    -- Notas y observaciones
    notas TEXT,

    -- Auditoría
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_estado_sesion CHECK (estado IN ('ABIERTA', 'CERRADA', 'CANCELADA'))
);

CREATE INDEX idx_sesiones_fecha_apertura ON sesiones_venta(fecha_apertura);
CREATE INDEX idx_sesiones_estado ON sesiones_venta(estado);
CREATE INDEX idx_sesiones_empleado ON sesiones_venta(empleado_id);
CREATE INDEX idx_sesiones_evento ON sesiones_venta(evento_id);
```

### 1.2. Tabla `consumos_sesion`

```sql
CREATE TABLE consumos_sesion (
    id BIGSERIAL PRIMARY KEY,

    -- Relaciones
    sesion_id BIGINT NOT NULL REFERENCES sesiones_venta(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES productos(id),

    -- Datos del consumo
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    -- Información del producto al momento del consumo
    producto_nombre VARCHAR(200) NOT NULL,
    producto_categoria VARCHAR(50),
    tipo_venta VARCHAR(20),

    -- Timestamp
    fecha_consumo TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Notas opcionales
    notas TEXT,

    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_precio_positivo CHECK (precio_unitario >= 0),
    CONSTRAINT chk_subtotal_positivo CHECK (subtotal >= 0)
);

CREATE INDEX idx_consumos_sesion ON consumos_sesion(sesion_id);
CREATE INDEX idx_consumos_producto ON consumos_sesion(producto_id);
CREATE INDEX idx_consumos_fecha ON consumos_sesion(fecha_consumo);
```

### 1.3. Trigger para actualizar totales de sesión

```sql
-- Función para actualizar totales de sesión
CREATE OR REPLACE FUNCTION actualizar_totales_sesion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sesiones_venta
    SET
        total_consumos = (
            SELECT COUNT(*)
            FROM consumos_sesion
            WHERE sesion_id = COALESCE(NEW.sesion_id, OLD.sesion_id)
        ),
        total_items = (
            SELECT COALESCE(SUM(cantidad), 0)
            FROM consumos_sesion
            WHERE sesion_id = COALESCE(NEW.sesion_id, OLD.sesion_id)
        ),
        valor_total = (
            SELECT COALESCE(SUM(subtotal), 0)
            FROM consumos_sesion
            WHERE sesion_id = COALESCE(NEW.sesion_id, OLD.sesion_id)
        ),
        actualizado_en = NOW()
    WHERE id = COALESCE(NEW.sesion_id, OLD.sesion_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT, UPDATE, DELETE
CREATE TRIGGER trg_actualizar_totales_sesion
AFTER INSERT OR UPDATE OR DELETE ON consumos_sesion
FOR EACH ROW
EXECUTE FUNCTION actualizar_totales_sesion();
```

### 1.4. Trigger para actualizar stock automáticamente

```sql
-- Función para descontar stock al registrar consumo
CREATE OR REPLACE FUNCTION descontar_stock_consumo()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo_venta VARCHAR(20);
    v_unidades_reales DECIMAL(10,2);
    v_cantidad_botellas DECIMAL(10,2);
BEGIN
    -- Obtener tipo de venta del producto
    SELECT tipo_venta, unidades_reales
    INTO v_tipo_venta, v_unidades_reales
    FROM productos
    WHERE id = NEW.producto_id;

    -- Calcular cuántas botellas se consumen
    IF v_tipo_venta IN ('COPA', 'CHUPITO') AND v_unidades_reales IS NOT NULL AND v_unidades_reales > 0 THEN
        -- Convertir copas/chupitos a botellas
        v_cantidad_botellas := NEW.cantidad / v_unidades_reales;
    ELSE
        -- Venta de botella completa
        v_cantidad_botellas := NEW.cantidad;
    END IF;

    -- Actualizar stock del producto
    UPDATE productos
    SET
        stock_actual = stock_actual - v_cantidad_botellas,
        actualizado_en = NOW()
    WHERE id = NEW.producto_id;

    -- Registrar movimiento de stock
    INSERT INTO movimientos_stock (
        producto_id,
        tipo_movimiento,
        cantidad,
        motivo,
        referencia,
        fecha_movimiento
    ) VALUES (
        NEW.producto_id,
        'SALIDA',
        v_cantidad_botellas,
        'Consumo POS - Sesión ' || NEW.sesion_id,
        'CONSUMO_' || NEW.id,
        NEW.fecha_consumo
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para descontar stock al insertar consumo
CREATE TRIGGER trg_descontar_stock_consumo
AFTER INSERT ON consumos_sesion
FOR EACH ROW
EXECUTE FUNCTION descontar_stock_consumo();
```

---

## 2. Entidades Backend (Java)

### 2.1. SesionVenta.java

```java
package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sesiones_venta")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SesionVenta {

    public enum EstadoSesion {
        ABIERTA,
        CERRADA,
        CANCELADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Relaciones
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id")
    private Evento evento;

    // Control de sesión
    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura = LocalDateTime.now();

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoSesion estado = EstadoSesion.ABIERTA;

    // Totales (calculados por triggers)
    @Column(name = "total_consumos")
    private Integer totalConsumos = 0;

    @Column(name = "total_items", precision = 10, scale = 2)
    private BigDecimal totalItems = BigDecimal.ZERO;

    @Column(name = "valor_total", precision = 10, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notas;

    // Relación con consumos
    @OneToMany(mappedBy = "sesion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ConsumoSesion> consumos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    // Métodos de utilidad
    @Transient
    public Boolean isAbierta() {
        return estado == EstadoSesion.ABIERTA;
    }

    @Transient
    public Boolean isCerrada() {
        return estado == EstadoSesion.CERRADA;
    }

    @Transient
    public Long getDuracionMinutos() {
        if (fechaCierre == null) {
            return java.time.Duration.between(fechaApertura, LocalDateTime.now()).toMinutes();
        }
        return java.time.Duration.between(fechaApertura, fechaCierre).toMinutes();
    }
}
```

### 2.2. ConsumoSesion.java

```java
package com.club.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "consumos_sesion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsumoSesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relaciones
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sesion_id", nullable = false)
    private SesionVenta sesion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // Datos del consumo
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidad = BigDecimal.ONE;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    // Snapshot del producto
    @Column(name = "producto_nombre", nullable = false, length = 200)
    private String productoNombre;

    @Column(name = "producto_categoria", length = 50)
    private String productoCategoria;

    @Column(name = "tipo_venta", length = 20)
    private String tipoVenta;

    @Column(name = "fecha_consumo", nullable = false)
    private LocalDateTime fechaConsumo = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String notas;

    // Método helper para crear desde producto
    public static ConsumoSesion fromProducto(Producto producto, BigDecimal cantidad) {
        ConsumoSesion consumo = new ConsumoSesion();
        consumo.setProducto(producto);
        consumo.setCantidad(cantidad);
        consumo.setPrecioUnitario(producto.getPrecioVenta());
        consumo.setSubtotal(producto.getPrecioVenta().multiply(cantidad));
        consumo.setProductoNombre(producto.getNombre());
        consumo.setProductoCategoria(producto.getCategoria());
        consumo.setTipoVenta(producto.getTipoVenta() != null ? producto.getTipoVenta().name() : null);
        return consumo;
    }
}
```

---

## 3. DTOs

### 3.1. SesionVentaDTO.java

```java
package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionVentaDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String estado;

    private Long empleadoId;
    private String empleadoNombre;

    private Long eventoId;
    private String eventoNombre;

    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;

    private Integer totalConsumos;
    private BigDecimal totalItems;
    private BigDecimal valorTotal;

    private Long duracionMinutos;

    private String notas;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
```

### 3.2. ConsumoSesionDTO.java

```java
package com.club.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumoSesionDTO {
    private Long id;
    private Long sesionId;
    private Long productoId;
    private String productoNombre;
    private String productoCategoria;
    private String tipoVenta;
    private BigDecimal cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private LocalDateTime fechaConsumo;
    private String notas;
}
```

### 3.3. Request DTOs

```java
package com.club.management.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SesionVentaRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    private String nombre;

    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    private String descripcion;

    private Long empleadoId;
    private Long eventoId;

    private String notas;
}

@Data
class RegistrarConsumoRequest {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
    private BigDecimal cantidad;

    private String notas;
}

@Data
class CerrarSesionRequest {
    private String notas;
}
```

---

## 4. Repositorios

### 4.1. SesionVentaRepository.java

```java
package com.club.management.repository;

import com.club.management.entity.SesionVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SesionVentaRepository extends JpaRepository<SesionVenta, Long> {

    Optional<SesionVenta> findByCodigo(String codigo);

    List<SesionVenta> findByEstadoOrderByFechaAperturaDesc(SesionVenta.EstadoSesion estado);

    List<SesionVenta> findByEmpleadoIdAndEstado(Long empleadoId, SesionVenta.EstadoSesion estado);

    List<SesionVenta> findByEventoIdOrderByFechaAperturaDesc(Long eventoId);

    @Query("SELECT s FROM SesionVenta s WHERE s.fechaApertura BETWEEN :inicio AND :fin ORDER BY s.fechaApertura DESC")
    List<SesionVenta> findByFechaAperturaBetween(
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin
    );

    @Query("SELECT s FROM SesionVenta s WHERE s.estado = 'ABIERTA' AND s.empleado.id = :empleadoId")
    Optional<SesionVenta> findSesionAbiertaByEmpleado(@Param("empleadoId") Long empleadoId);

    Long countByEstado(SesionVenta.EstadoSesion estado);
}
```

### 4.2. ConsumoSesionRepository.java

```java
package com.club.management.repository;

import com.club.management.entity.ConsumoSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConsumoSesionRepository extends JpaRepository<ConsumoSesion, Long> {

    List<ConsumoSesion> findBySesionIdOrderByFechaConsumoDesc(Long sesionId);

    List<ConsumoSesion> findByProductoIdOrderByFechaConsumoDesc(Long productoId);

    @Query("SELECT c FROM ConsumoSesion c WHERE c.fechaConsumo BETWEEN :inicio AND :fin ORDER BY c.fechaConsumo DESC")
    List<ConsumoSesion> findByFechaConsumoBetween(
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin
    );

    @Query("SELECT c.productoNombre, SUM(c.cantidad) as total FROM ConsumoSesion c " +
           "WHERE c.sesion.id = :sesionId GROUP BY c.productoNombre ORDER BY total DESC")
    List<Object[]> findTopProductosBySesion(@Param("sesionId") Long sesionId);

    @Query("SELECT SUM(c.subtotal) FROM ConsumoSesion c WHERE c.sesion.id = :sesionId")
    BigDecimal sumSubtotalBySesion(@Param("sesionId") Long sesionId);
}
```

---

## 5. Servicios

### 5.1. SesionVentaService.java

```java
package com.club.management.service;

import com.club.management.dto.request.SesionVentaRequest;
import com.club.management.dto.request.RegistrarConsumoRequest;
import com.club.management.dto.request.CerrarSesionRequest;
import com.club.management.dto.response.SesionVentaDTO;
import com.club.management.dto.response.ConsumoSesionDTO;
import com.club.management.entity.*;
import com.club.management.exception.ResourceNotFoundException;
import com.club.management.exception.BusinessException;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SesionVentaService {

    private final SesionVentaRepository sesionRepository;
    private final ConsumoSesionRepository consumoRepository;
    private final ProductoRepository productoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final EventoRepository eventoRepository;

    @Transactional
    public SesionVentaDTO abrirSesion(SesionVentaRequest request) {
        // Validar que el empleado no tenga otra sesión abierta
        if (request.getEmpleadoId() != null) {
            sesionRepository.findSesionAbiertaByEmpleado(request.getEmpleadoId())
                .ifPresent(s -> {
                    throw new BusinessException(
                        "El empleado ya tiene una sesión abierta: " + s.getCodigo()
                    );
                });
        }

        SesionVenta sesion = new SesionVenta();
        sesion.setCodigo(generarCodigoSesion());
        sesion.setNombre(request.getNombre());
        sesion.setDescripcion(request.getDescripcion());
        sesion.setNotas(request.getNotas());
        sesion.setEstado(SesionVenta.EstadoSesion.ABIERTA);
        sesion.setFechaApertura(LocalDateTime.now());

        // Asociar empleado si se proporciona
        if (request.getEmpleadoId() != null) {
            Empleado empleado = empleadoRepository.findById(request.getEmpleadoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Empleado no encontrado con ID: " + request.getEmpleadoId()
                ));
            sesion.setEmpleado(empleado);
        }

        // Asociar evento si se proporciona
        if (request.getEventoId() != null) {
            Evento evento = eventoRepository.findById(request.getEventoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Evento no encontrado con ID: " + request.getEventoId()
                ));
            sesion.setEvento(evento);
        }

        sesion = sesionRepository.save(sesion);
        return toDTO(sesion);
    }

    @Transactional
    public ConsumoSesionDTO registrarConsumo(Long sesionId, RegistrarConsumoRequest request) {
        // Validar que la sesión existe y está abierta
        SesionVenta sesion = sesionRepository.findById(sesionId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Sesión no encontrada con ID: " + sesionId
            ));

        if (!sesion.isAbierta()) {
            throw new BusinessException("No se pueden registrar consumos en una sesión cerrada");
        }

        // Validar que el producto existe y está activo
        Producto producto = productoRepository.findById(request.getProductoId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Producto no encontrado con ID: " + request.getProductoId()
            ));

        if (!producto.getActivo()) {
            throw new BusinessException("El producto está inactivo y no puede venderse");
        }

        // Validar stock disponible
        validarStockDisponible(producto, request.getCantidad());

        // Crear consumo
        ConsumoSesion consumo = ConsumoSesion.fromProducto(producto, request.getCantidad());
        consumo.setSesion(sesion);
        consumo.setNotas(request.getNotas());
        consumo.setFechaConsumo(LocalDateTime.now());

        consumo = consumoRepository.save(consumo);

        return toDTO(consumo);
    }

    @Transactional
    public SesionVentaDTO cerrarSesion(Long sesionId, CerrarSesionRequest request) {
        SesionVenta sesion = sesionRepository.findById(sesionId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Sesión no encontrada con ID: " + sesionId
            ));

        if (sesion.isCerrada()) {
            throw new BusinessException("La sesión ya está cerrada");
        }

        sesion.setEstado(SesionVenta.EstadoSesion.CERRADA);
        sesion.setFechaCierre(LocalDateTime.now());

        if (request.getNotas() != null) {
            String notasExistentes = sesion.getNotas() != null ? sesion.getNotas() + "\n\n" : "";
            sesion.setNotas(notasExistentes + "CIERRE: " + request.getNotas());
        }

        sesion = sesionRepository.save(sesion);
        return toDTO(sesion);
    }

    @Transactional(readOnly = true)
    public SesionVentaDTO obtenerSesion(Long id) {
        SesionVenta sesion = sesionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Sesión no encontrada con ID: " + id
            ));
        return toDTO(sesion);
    }

    @Transactional(readOnly = true)
    public List<SesionVentaDTO> listarSesiones() {
        return sesionRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SesionVentaDTO> listarSesionesAbiertas() {
        return sesionRepository.findByEstadoOrderByFechaAperturaDesc(SesionVenta.EstadoSesion.ABIERTA)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConsumoSesionDTO> listarConsumosDeSesion(Long sesionId) {
        return consumoRepository.findBySesionIdOrderByFechaConsumoDesc(sesionId)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    // Métodos auxiliares

    private String generarCodigoSesion() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "SES-" + timestamp;
    }

    private void validarStockDisponible(Producto producto, java.math.BigDecimal cantidadSolicitada) {
        java.math.BigDecimal stockDisponible;

        if (producto.isVentaPorServicio()) {
            // Para copas/chupitos, verificar servicios disponibles
            stockDisponible = producto.getServiciosDisponibles();
        } else {
            // Para botellas, verificar stock directo
            stockDisponible = producto.getStockActual();
        }

        if (stockDisponible.compareTo(cantidadSolicitada) < 0) {
            throw new BusinessException(
                String.format("Stock insuficiente. Disponible: %.2f, Solicitado: %.2f",
                    stockDisponible, cantidadSolicitada)
            );
        }
    }

    private SesionVentaDTO toDTO(SesionVenta sesion) {
        return SesionVentaDTO.builder()
            .id(sesion.getId())
            .codigo(sesion.getCodigo())
            .nombre(sesion.getNombre())
            .descripcion(sesion.getDescripcion())
            .estado(sesion.getEstado().name())
            .empleadoId(sesion.getEmpleado() != null ? sesion.getEmpleado().getId() : null)
            .empleadoNombre(sesion.getEmpleado() != null ? sesion.getEmpleado().getNombre() : null)
            .eventoId(sesion.getEvento() != null ? sesion.getEvento().getId() : null)
            .eventoNombre(sesion.getEvento() != null ? sesion.getEvento().getNombre() : null)
            .fechaApertura(sesion.getFechaApertura())
            .fechaCierre(sesion.getFechaCierre())
            .totalConsumos(sesion.getTotalConsumos())
            .totalItems(sesion.getTotalItems())
            .valorTotal(sesion.getValorTotal())
            .duracionMinutos(sesion.getDuracionMinutos())
            .notas(sesion.getNotas())
            .creadoEn(sesion.getCreadoEn())
            .actualizadoEn(sesion.getActualizadoEn())
            .build();
    }

    private ConsumoSesionDTO toDTO(ConsumoSesion consumo) {
        return ConsumoSesionDTO.builder()
            .id(consumo.getId())
            .sesionId(consumo.getSesion().getId())
            .productoId(consumo.getProducto().getId())
            .productoNombre(consumo.getProductoNombre())
            .productoCategoria(consumo.getProductoCategoria())
            .tipoVenta(consumo.getTipoVenta())
            .cantidad(consumo.getCantidad())
            .precioUnitario(consumo.getPrecioUnitario())
            .subtotal(consumo.getSubtotal())
            .fechaConsumo(consumo.getFechaConsumo())
            .notas(consumo.getNotas())
            .build();
    }
}
```

---

## 6. Controller

### 6.1. SesionVentaController.java

```java
package com.club.management.controller;

import com.club.management.dto.request.SesionVentaRequest;
import com.club.management.dto.request.RegistrarConsumoRequest;
import com.club.management.dto.request.CerrarSesionRequest;
import com.club.management.dto.response.SesionVentaDTO;
import com.club.management.dto.response.ConsumoSesionDTO;
import com.club.management.service.SesionVentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sesiones-venta")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
public class SesionVentaController {

    private final SesionVentaService sesionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<SesionVentaDTO> abrirSesion(@Valid @RequestBody SesionVentaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(sesionService.abrirSesion(request));
    }

    @PostMapping("/{id}/consumos")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<ConsumoSesionDTO> registrarConsumo(
            @PathVariable Long id,
            @Valid @RequestBody RegistrarConsumoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(sesionService.registrarConsumo(id, request));
    }

    @PostMapping("/{id}/cerrar")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<SesionVentaDTO> cerrarSesion(
            @PathVariable Long id,
            @RequestBody(required = false) CerrarSesionRequest request) {
        return ResponseEntity.ok(sesionService.cerrarSesion(id, request != null ? request : new CerrarSesionRequest()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SesionVentaDTO> obtenerSesion(@PathVariable Long id) {
        return ResponseEntity.ok(sesionService.obtenerSesion(id));
    }

    @GetMapping
    public ResponseEntity<List<SesionVentaDTO>> listarSesiones() {
        return ResponseEntity.ok(sesionService.listarSesiones());
    }

    @GetMapping("/abiertas")
    public ResponseEntity<List<SesionVentaDTO>> listarSesionesAbiertas() {
        return ResponseEntity.ok(sesionService.listarSesionesAbiertas());
    }

    @GetMapping("/{id}/consumos")
    public ResponseEntity<List<ConsumoSesionDTO>> listarConsumosDeSesion(@PathVariable Long id) {
        return ResponseEntity.ok(sesionService.listarConsumosDeSesion(id));
    }
}
```

---

## 7. Migración Flyway

### V010__crear_tablas_pos.sql

```sql
-- Crear tabla de sesiones de venta
CREATE TABLE sesiones_venta (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    empleado_id BIGINT REFERENCES empleados(id),
    evento_id BIGINT REFERENCES eventos(id),

    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',

    total_consumos INTEGER DEFAULT 0,
    total_items DECIMAL(10,2) DEFAULT 0.00,
    valor_total DECIMAL(10,2) DEFAULT 0.00,

    notas TEXT,

    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_estado_sesion CHECK (estado IN ('ABIERTA', 'CERRADA', 'CANCELADA'))
);

CREATE INDEX idx_sesiones_fecha_apertura ON sesiones_venta(fecha_apertura);
CREATE INDEX idx_sesiones_estado ON sesiones_venta(estado);
CREATE INDEX idx_sesiones_empleado ON sesiones_venta(empleado_id);
CREATE INDEX idx_sesiones_evento ON sesiones_venta(evento_id);

-- Crear tabla de consumos de sesión
CREATE TABLE consumos_sesion (
    id BIGSERIAL PRIMARY KEY,

    sesion_id BIGINT NOT NULL REFERENCES sesiones_venta(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES productos(id),

    cantidad DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    producto_nombre VARCHAR(200) NOT NULL,
    producto_categoria VARCHAR(50),
    tipo_venta VARCHAR(20),

    fecha_consumo TIMESTAMP NOT NULL DEFAULT NOW(),
    notas TEXT,

    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_precio_positivo CHECK (precio_unitario >= 0),
    CONSTRAINT chk_subtotal_positivo CHECK (subtotal >= 0)
);

CREATE INDEX idx_consumos_sesion ON consumos_sesion(sesion_id);
CREATE INDEX idx_consumos_producto ON consumos_sesion(producto_id);
CREATE INDEX idx_consumos_fecha ON consumos_sesion(fecha_consumo);

-- Función para actualizar totales de sesión
CREATE OR REPLACE FUNCTION actualizar_totales_sesion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sesiones_venta
    SET
        total_consumos = (
            SELECT COUNT(*)
            FROM consumos_sesion
            WHERE sesion_id = COALESCE(NEW.sesion_id, OLD.sesion_id)
        ),
        total_items = (
            SELECT COALESCE(SUM(cantidad), 0)
            FROM consumos_sesion
            WHERE sesion_id = COALESCE(NEW.sesion_id, OLD.sesion_id)
        ),
        valor_total = (
            SELECT COALESCE(SUM(subtotal), 0)
            FROM consumos_sesion
            WHERE sesion_id = COALESCE(NEW.sesion_id, OLD.sesion_id)
        ),
        actualizado_en = NOW()
    WHERE id = COALESCE(NEW.sesion_id, OLD.sesion_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar totales
CREATE TRIGGER trg_actualizar_totales_sesion
AFTER INSERT OR UPDATE OR DELETE ON consumos_sesion
FOR EACH ROW
EXECUTE FUNCTION actualizar_totales_sesion();

-- Función para descontar stock al registrar consumo
CREATE OR REPLACE FUNCTION descontar_stock_consumo()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo_venta VARCHAR(20);
    v_unidades_reales DECIMAL(10,2);
    v_cantidad_botellas DECIMAL(10,2);
BEGIN
    SELECT tipo_venta, unidades_reales
    INTO v_tipo_venta, v_unidades_reales
    FROM productos
    WHERE id = NEW.producto_id;

    IF v_tipo_venta IN ('COPA', 'CHUPITO') AND v_unidades_reales IS NOT NULL AND v_unidades_reales > 0 THEN
        v_cantidad_botellas := NEW.cantidad / v_unidades_reales;
    ELSE
        v_cantidad_botellas := NEW.cantidad;
    END IF;

    UPDATE productos
    SET
        stock_actual = stock_actual - v_cantidad_botellas,
        actualizado_en = NOW()
    WHERE id = NEW.producto_id;

    INSERT INTO movimientos_stock (
        producto_id,
        tipo_movimiento,
        cantidad,
        motivo,
        referencia,
        fecha_movimiento
    ) VALUES (
        NEW.producto_id,
        'SALIDA',
        v_cantidad_botellas,
        'Consumo POS - Sesión ' || NEW.sesion_id,
        'CONSUMO_' || NEW.id,
        NEW.fecha_consumo
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para descontar stock
CREATE TRIGGER trg_descontar_stock_consumo
AFTER INSERT ON consumos_sesion
FOR EACH ROW
EXECUTE FUNCTION descontar_stock_consumo();

COMMENT ON TABLE sesiones_venta IS 'Sesiones de venta del sistema POS';
COMMENT ON TABLE consumos_sesion IS 'Registro de consumos por sesión';
```

---

## 8. Frontend - Estructura de Archivos

```
frontend/src/
├── api/
│   └── sesiones-venta.api.ts          # Llamadas API
├── types/
│   └── sesion-venta.types.ts          # Tipos TypeScript
├── pages/
│   └── pos/
│       ├── PosPage.tsx                # Página principal POS
│       └── SesionesListPage.tsx       # Lista de sesiones
└── components/
    └── pos/
        ├── SesionActiva.tsx           # Componente sesión activa
        ├── ProductoGrid.tsx           # Grid de productos
        ├── ConsumosList.tsx           # Lista de consumos
        ├── AbrirSesionModal.tsx       # Modal abrir sesión
        └── CerrarSesionModal.tsx      # Modal cerrar sesión
```

---

## 9. Frontend - Tipos TypeScript

### sesion-venta.types.ts

```typescript
export interface SesionVenta {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  empleadoId?: number;
  empleadoNombre?: string;
  eventoId?: number;
  eventoNombre?: string;
  fechaApertura: string;
  fechaCierre?: string;
  totalConsumos: number;
  totalItems: number;
  valorTotal: number;
  duracionMinutos: number;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ConsumoSesion {
  id: number;
  sesionId: number;
  productoId: number;
  productoNombre: string;
  productoCategoria?: string;
  tipoVenta?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaConsumo: string;
  notas?: string;
}

export interface AbrirSesionRequest {
  nombre: string;
  descripcion?: string;
  empleadoId?: number;
  eventoId?: number;
  notas?: string;
}

export interface RegistrarConsumoRequest {
  productoId: number;
  cantidad: number;
  notas?: string;
}

export interface CerrarSesionRequest {
  notas?: string;
}
```

---

## 10. Frontend - API Client

### sesiones-venta.api.ts

```typescript
import axios from './axios';
import {
  SesionVenta,
  ConsumoSesion,
  AbrirSesionRequest,
  RegistrarConsumoRequest,
  CerrarSesionRequest
} from '@/types/sesion-venta.types';

export const sesionesVentaApi = {
  abrirSesion: async (data: AbrirSesionRequest): Promise<SesionVenta> => {
    const response = await axios.post('/sesiones-venta', data);
    return response.data;
  },

  cerrarSesion: async (id: number, data?: CerrarSesionRequest): Promise<SesionVenta> => {
    const response = await axios.post(`/sesiones-venta/${id}/cerrar`, data);
    return response.data;
  },

  registrarConsumo: async (
    sesionId: number,
    data: RegistrarConsumoRequest
  ): Promise<ConsumoSesion> => {
    const response = await axios.post(`/sesiones-venta/${sesionId}/consumos`, data);
    return response.data;
  },

  obtenerSesion: async (id: number): Promise<SesionVenta> => {
    const response = await axios.get(`/sesiones-venta/${id}`);
    return response.data;
  },

  listarSesiones: async (): Promise<SesionVenta[]> => {
    const response = await axios.get('/sesiones-venta');
    return response.data;
  },

  listarSesionesAbiertas: async (): Promise<SesionVenta[]> => {
    const response = await axios.get('/sesiones-venta/abiertas');
    return response.data;
  },

  listarConsumosDeSesion: async (sesionId: number): Promise<ConsumoSesion[]> => {
    const response = await axios.get(`/sesiones-venta/${sesionId}/consumos`);
    return response.data;
  }
};
```

---

## 11. Flujo de Uso

### Caso de uso típico:

1. **Abrir sesión**
   - Empleado abre turno
   - Sistema genera código único (SES-20251009221500)
   - Sesión queda en estado ABIERTA

2. **Registrar consumos**
   - Cliente pide "2 gin-tonics"
   - Empleado busca producto "Gin Tonic" y agrega cantidad 2
   - Sistema:
     - Calcula precio (2 × 8€ = 16€)
     - Descuenta stock automáticamente (2 copas = 0.22 botellas)
     - Registra movimiento de stock
     - Actualiza totales de sesión

3. **Durante la sesión**
   - Ver total acumulado en tiempo real
   - Ver listado de consumos
   - Stock se actualiza automáticamente

4. **Cerrar sesión**
   - Al finalizar turno, empleado cierra sesión
   - Sistema genera resumen:
     - Total consumos: 45
     - Total items: 67 unidades
     - Valor total: 420€
   - Sesión pasa a estado CERRADA

---

## 12. Consideraciones Técnicas

### Transaccionalidad
- Todos los registros de consumo son transaccionales
- Si falla el descuento de stock, se revierte el consumo
- Los triggers garantizan consistencia de datos

### Concurrencia
- Una sesión por empleado a la vez
- Lock optimista en actualizaciones de stock
- Timestamps para auditoría completa

### Performance
- Índices en campos de búsqueda frecuente
- Cálculos de totales mediante triggers (no en runtime)
- Eager loading para relaciones frecuentes

### Seguridad
- Solo roles ADMIN, GERENTE, ENCARGADO pueden usar POS
- JWT token en todas las peticiones
- Validación de stock antes de registrar consumo

---

## 13. Próximos Pasos para Implementación

1. **Backend**:
   - Crear archivos de entidades Java
   - Crear repositorios
   - Crear servicio
   - Crear controller
   - Crear migración Flyway V010

2. **Frontend**:
   - Crear tipos TypeScript
   - Crear API client
   - Crear componentes UI
   - Crear páginas
   - Agregar rutas

3. **Testing**:
   - Tests unitarios del servicio
   - Tests de integración de endpoints
   - Tests frontend con Vitest

4. **Documentación**:
   - Actualizar README
   - Crear API documentation
   - Ejemplos de uso

---

**Fecha creación**: 2025-10-09
**Versión**: 1.0
**Estado**: Listo para implementación
