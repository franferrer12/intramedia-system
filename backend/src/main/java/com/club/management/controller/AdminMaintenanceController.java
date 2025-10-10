package com.club.management.controller;

import com.club.management.entity.Producto;
import com.club.management.repository.ProductoRepository;
import com.club.management.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador temporal para tareas de mantenimiento
 * NOTA: Eliminar después de ejecutar las tareas necesarias
 */
@RestController
@RequestMapping("/api/admin/maintenance")
@RequiredArgsConstructor
public class AdminMaintenanceController {

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

    /**
     * Endpoint temporal para actualizar el hash del password del admin a BCrypt cost=4
     * Este endpoint rehashea el password 'admin123' con cost factor 4 para mejor performance
     */
    @PostMapping("/rehash-admin-password")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> rehashAdminPassword() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Ejecutar update SQL directo
            int updated = usuarioRepository.updateAdminPasswordHash(
                "$2y$04$gj602DDev6dFCqXcURHydOeJ1lt0tnB4OUlZveQuSAGy56xOrgCBe"
            );

            response.put("success", true);
            response.put("message", "Password hash actualizado correctamente");
            response.put("rowsAffected", updated);
            response.put("note", "Login debería ser ~87% más rápido (1.3s → 0.15s)");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint para verificar el hash actual del admin
     */
    @PostMapping("/check-admin-hash")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> checkAdminHash() {
        Map<String, Object> response = new HashMap<>();

        var admin = usuarioRepository.findByUsername("admin");
        if (admin.isPresent()) {
            String hash = admin.get().getPassword();
            String prefix = hash.substring(0, Math.min(10, hash.length()));

            response.put("hashPrefix", prefix);
            response.put("isCost4", prefix.startsWith("$2y$04$") || prefix.startsWith("$2a$04$"));
            response.put("isCost10", prefix.startsWith("$2a$10$"));
            response.put("note", prefix.startsWith("$2y$04$") || prefix.startsWith("$2a$04$")
                ? "✅ Hash rápido (cost=4) - Login debería ser rápido"
                : "⚠️ Hash lento (cost=10) - Login será lento");

            return ResponseEntity.ok(response);
        }

        response.put("error", "Usuario admin no encontrado");
        return ResponseEntity.notFound().build();
    }

    /**
     * Listar productos sin categoría
     */
    @GetMapping("/productos-sin-categoria")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getProductosSinCategoria() {
        List<Producto> productos = productoRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Producto p : productos) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getId());
            item.put("codigo", p.getCodigo());
            item.put("nombre", p.getNombre());
            item.put("categoria", p.getCategoria());
            item.put("categoriaVacia", p.getCategoria() == null || p.getCategoria().trim().isEmpty());
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Actualizar categoría de un producto
     */
    @PostMapping("/actualizar-categoria/{productoId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> actualizarCategoria(
            @PathVariable Long productoId,
            @RequestParam String categoria
    ) {
        Map<String, Object> response = new HashMap<>();

        try {
            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            String categoriaAnterior = producto.getCategoria();
            producto.setCategoria(categoria);
            productoRepository.save(producto);

            response.put("success", true);
            response.put("message", "Categoría actualizada correctamente");
            response.put("productoId", productoId);
            response.put("nombre", producto.getNombre());
            response.put("categoriaAnterior", categoriaAnterior);
            response.put("categoriaNueva", categoria);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Actualizar categorías en lote basado en nombre del producto
     */
    @PostMapping("/auto-categorizar-productos")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> autoCategorizarProductos() {
        Map<String, Object> response = new HashMap<>();
        List<Producto> productos = productoRepository.findAll();
        int actualizados = 0;

        for (Producto p : productos) {
            String categoria = inferirCategoria(p.getNombre());
            if (!categoria.equals("Sin Categoría")) {
                p.setCategoria(categoria);
                productoRepository.save(p);
                actualizados++;
            }
        }

        response.put("success", true);
        response.put("message", "Productos categorizados automáticamente");
        response.put("totalProductos", productos.size());
        response.put("productosActualizados", actualizados);

        return ResponseEntity.ok(response);
    }

    /**
     * Inferir categoría basándose en el nombre del producto
     */
    private String inferirCategoria(String nombre) {
        if (nombre == null) return "Sin Categoría";

        String nombreLower = nombre.toLowerCase();

        // Licores y destilados
        if (nombreLower.contains("vodka") || nombreLower.contains("gin") || nombreLower.contains("ron") ||
            nombreLower.contains("whisky") || nombreLower.contains("whiskey") || nombreLower.contains("tequila") ||
            nombreLower.contains("brandy") || nombreLower.contains("cognac")) {
            return "Licores";
        }

        // Vinos
        if (nombreLower.contains("vino") || nombreLower.contains("wine") || nombreLower.contains("champagne") ||
            nombreLower.contains("cava") || nombreLower.contains("prosecco")) {
            return "Vinos";
        }

        // Cervezas
        if (nombreLower.contains("cerveza") || nombreLower.contains("beer") || nombreLower.contains("ipa") ||
            nombreLower.contains("lager")) {
            return "Cervezas";
        }

        // Refrescos y mezcladores
        if (nombreLower.contains("coca") || nombreLower.contains("pepsi") || nombreLower.contains("fanta") ||
            nombreLower.contains("sprite") || nombreLower.contains("tónica") || nombreLower.contains("tonic") ||
            nombreLower.contains("redbull") || nombreLower.contains("red bull") || nombreLower.contains("agua")) {
            return "Refrescos y Mezcladores";
        }

        // Licores dulces
        if (nombreLower.contains("licor") || nombreLower.contains("baileys") || nombreLower.contains("kahlua") ||
            nombreLower.contains("amaretto") || nombreLower.contains("cointreau")) {
            return "Licores Dulces";
        }

        // Snacks
        if (nombreLower.contains("chips") || nombreLower.contains("patatas") || nombreLower.contains("frutos") ||
            nombreLower.contains("cacahuetes") || nombreLower.contains("aceitunas")) {
            return "Snacks";
        }

        return "Sin Categoría";
    }
}
