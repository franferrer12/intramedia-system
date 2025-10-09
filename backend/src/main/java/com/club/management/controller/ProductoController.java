package com.club.management.controller;

import com.club.management.dto.request.ProductoFormData;
import com.club.management.dto.response.ProductoDTO;
import com.club.management.entity.Producto.TipoVenta;
import com.club.management.service.ProductoCalculationService;
import com.club.management.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;
    private final ProductoCalculationService calculationService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<ProductoDTO>> getAllProductos() {
        return ResponseEntity.ok(productoService.getAllProductos());
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<ProductoDTO>> getProductosActivos() {
        return ResponseEntity.ok(productoService.getProductosActivos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<ProductoDTO> getProductoById(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.getProductoById(id));
    }

    @GetMapping("/categorias")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<String>> getCategorias() {
        return ResponseEntity.ok(productoService.getCategorias());
    }

    @GetMapping("/bajo-stock")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<List<ProductoDTO>> getProductosBajoStock() {
        return ResponseEntity.ok(productoService.getProductosBajoStock());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<ProductoDTO> crearProducto(@Valid @RequestBody ProductoFormData formData) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productoService.crearProducto(formData));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<ProductoDTO> actualizarProducto(
            @PathVariable Long id,
            @Valid @RequestBody ProductoFormData formData) {
        return ResponseEntity.ok(productoService.actualizarProducto(id, formData));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        productoService.eliminarProducto(id);
        return ResponseEntity.noContent().build();
    }

    // ========== ENDPOINTS PARA MODELO DE OCIO NOCTURNO ==========

    /**
     * Obtener presets de configuración para un tipo de venta
     * GET /api/productos/presets/{tipoVenta}
     */
    @GetMapping("/presets/{tipoVenta}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<Map<String, Object>> getPresets(@PathVariable String tipoVenta) {
        try {
            TipoVenta tipo = TipoVenta.valueOf(tipoVenta.toUpperCase());
            return ResponseEntity.ok(calculationService.getPresets(tipo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Calcular métricas de un producto sin guardarlo (preview)
     * POST /api/productos/calcular
     * Body: {
     *   "precioCompra": 12.00,
     *   "precioVenta": 7.00,
     *   "capacidadMl": 1000,
     *   "tipoVenta": "COPA",
     *   "mlPorServicio": 90,   // opcional, usa preset si no se proporciona
     *   "factorMerma": 10      // opcional, usa preset si no se proporciona
     * }
     */
    @PostMapping("/calcular")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO')")
    public ResponseEntity<Map<String, Object>> calcularMetricas(@Valid @RequestBody Map<String, Object> request) {
        try {
            BigDecimal precioCompra = new BigDecimal(request.get("precioCompra").toString());
            BigDecimal precioVenta = new BigDecimal(request.get("precioVenta").toString());
            BigDecimal capacidadMl = new BigDecimal(request.get("capacidadMl").toString());
            TipoVenta tipoVenta = TipoVenta.valueOf(request.get("tipoVenta").toString().toUpperCase());

            BigDecimal mlPorServicio = request.containsKey("mlPorServicio") && request.get("mlPorServicio") != null
                    ? new BigDecimal(request.get("mlPorServicio").toString())
                    : null;

            BigDecimal factorMerma = request.containsKey("factorMerma") && request.get("factorMerma") != null
                    ? new BigDecimal(request.get("factorMerma").toString())
                    : null;

            Map<String, Object> metricas = calculationService.calcularMetricas(
                    precioCompra, precioVenta, capacidadMl, tipoVenta, mlPorServicio, factorMerma
            );

            return ResponseEntity.ok(metricas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener todos los tipos de venta disponibles
     * GET /api/productos/tipos-venta
     */
    @GetMapping("/tipos-venta")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<List<Map<String, String>>> getTiposVenta() {
        List<Map<String, String>> tipos = List.of(
                Map.of(
                        "value", "COPA",
                        "label", "Copa (90ml - 6 seg)",
                        "descripcion", "Bebidas largas: gin-tonic, cubata, etc."
                ),
                Map.of(
                        "value", "CHUPITO",
                        "label", "Chupito (30ml - 2 seg)",
                        "descripcion", "Shots individuales"
                ),
                Map.of(
                        "value", "BOTELLA",
                        "label", "Botella completa",
                        "descripcion", "Venta de botella completa para reservados VIP"
                )
        );
        return ResponseEntity.ok(tipos);
    }
}
