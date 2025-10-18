package com.club.management.service;

import com.club.management.dto.PlantillaPedidoDTO;
import com.club.management.model.Pedido;
import com.club.management.model.PlantillaPedido;
import com.club.management.model.Proveedor;
import com.club.management.model.Usuario;
import com.club.management.repository.PedidoRepository;
import com.club.management.repository.PlantillaPedidoRepository;
import com.club.management.repository.ProveedorRepository;
import com.club.management.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlantillaPedidoService {

    private final PlantillaPedidoRepository plantillaRepository;
    private final ProveedorRepository proveedorRepository;
    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final ObjectMapper objectMapper;

    /**
     * Obtener todas las plantillas
     */
    @Transactional(readOnly = true)
    public List<PlantillaPedidoDTO> getAllPlantillas() {
        return plantillaRepository.findAllByOrderByFechaCreacionDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener plantillas activas
     */
    @Transactional(readOnly = true)
    public List<PlantillaPedidoDTO> getPlantillasActivas() {
        return plantillaRepository.findByActivaTrueOrderByNombreAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener plantilla por ID
     */
    @Transactional(readOnly = true)
    public PlantillaPedidoDTO getPlantillaById(Long id) {
        PlantillaPedido plantilla = plantillaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plantilla no encontrada con id: " + id));
        return mapToDTO(plantilla);
    }

    /**
     * Obtener plantillas por proveedor
     */
    @Transactional(readOnly = true)
    public List<PlantillaPedidoDTO> getPlantillasByProveedor(Long proveedorId) {
        Proveedor proveedor = proveedorRepository.findById(proveedorId)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        return plantillaRepository.findByProveedorAndActivaTrue(proveedor)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Buscar plantillas
     */
    @Transactional(readOnly = true)
    public List<PlantillaPedidoDTO> buscarPlantillas(String busqueda) {
        return plantillaRepository.buscarActivasPorNombreODescripcion(busqueda)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crear nueva plantilla
     */
    @Transactional
    public PlantillaPedidoDTO crearPlantilla(PlantillaPedidoDTO dto, Long usuarioId) {
        Proveedor proveedor = proveedorRepository.findById(dto.getProveedorId())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        PlantillaPedido plantilla = PlantillaPedido.builder()
                .nombre(dto.getNombre())
                .descripcion(dto.getDescripcion())
                .proveedor(proveedor)
                .detalles(dto.getDetalles())
                .observaciones(dto.getObservaciones())
                .activa(true)
                .creadoPor(usuario)
                .build();

        PlantillaPedido saved = plantillaRepository.save(plantilla);
        return mapToDTO(saved);
    }

    /**
     * Crear plantilla desde un pedido existente
     */
    @Transactional
    public PlantillaPedidoDTO crearPlantillaDesdePedido(
            Long pedidoId,
            String nombre,
            String descripcion,
            Long usuarioId
    ) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Convertir detalles del pedido a JSON
        JsonNode detalles = convertirDetallesPedidoAJson(pedido);

        PlantillaPedido plantilla = PlantillaPedido.crearDesdePedido(
                pedido,
                nombre,
                descripcion,
                usuario,
                detalles
        );

        PlantillaPedido saved = plantillaRepository.save(plantilla);
        return mapToDTO(saved);
    }

    /**
     * Actualizar plantilla
     */
    @Transactional
    public PlantillaPedidoDTO actualizarPlantilla(Long id, PlantillaPedidoDTO dto) {
        PlantillaPedido plantilla = plantillaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plantilla no encontrada"));

        if (dto.getProveedorId() != null && !dto.getProveedorId().equals(plantilla.getProveedor().getId())) {
            Proveedor nuevoProveedor = proveedorRepository.findById(dto.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
            plantilla.setProveedor(nuevoProveedor);
        }

        if (dto.getNombre() != null) {
            plantilla.setNombre(dto.getNombre());
        }
        if (dto.getDescripcion() != null) {
            plantilla.setDescripcion(dto.getDescripcion());
        }
        if (dto.getDetalles() != null) {
            plantilla.setDetalles(dto.getDetalles());
        }
        if (dto.getObservaciones() != null) {
            plantilla.setObservaciones(dto.getObservaciones());
        }

        PlantillaPedido updated = plantillaRepository.save(plantilla);
        return mapToDTO(updated);
    }

    /**
     * Activar/Desactivar plantilla
     */
    @Transactional
    public PlantillaPedidoDTO toggleActiva(Long id) {
        PlantillaPedido plantilla = plantillaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plantilla no encontrada"));

        plantilla.setActiva(!plantilla.getActiva());
        PlantillaPedido updated = plantillaRepository.save(plantilla);
        return mapToDTO(updated);
    }

    /**
     * Eliminar plantilla
     */
    @Transactional
    public void eliminarPlantilla(Long id) {
        if (!plantillaRepository.existsById(id)) {
            throw new RuntimeException("Plantilla no encontrada");
        }
        plantillaRepository.deleteById(id);
    }

    /**
     * Obtener estadísticas de plantillas
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getEstadisticas() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();

        long total = plantillaRepository.count();
        long activas = plantillaRepository.countByActivaTrue();

        stats.put("totalPlantillas", total);
        stats.put("plantillasActivas", activas);
        stats.put("plantillasInactivas", total - activas);

        return stats;
    }

    // Helper methods

    private JsonNode convertirDetallesPedidoAJson(Pedido pedido) {
        // Convertir los detalles del pedido a formato JSON para la plantilla
        // Formato: [{"productoId": 1, "cantidad": 10, "precioUnitario": 5.50}]
        try {
            List<java.util.Map<String, Object>> detalles = pedido.getDetalles().stream()
                    .map(detalle -> {
                        java.util.Map<String, Object> map = new java.util.HashMap<>();
                        map.put("productoId", detalle.getProducto().getId());
                        map.put("productoNombre", detalle.getProducto().getNombre());
                        map.put("cantidad", detalle.getCantidad());
                        map.put("precioUnitario", detalle.getPrecioUnitario());
                        return map;
                    })
                    .collect(Collectors.toList());

            return objectMapper.valueToTree(detalles);
        } catch (Exception e) {
            throw new RuntimeException("Error al convertir detalles del pedido", e);
        }
    }

    private PlantillaPedidoDTO mapToDTO(PlantillaPedido plantilla) {
        return PlantillaPedidoDTO.builder()
                .id(plantilla.getId())
                .nombre(plantilla.getNombre())
                .descripcion(plantilla.getDescripcion())
                .proveedorId(plantilla.getProveedor().getId())
                .proveedorNombre(plantilla.getProveedor().getNombre())
                .detalles(plantilla.getDetalles())
                .observaciones(plantilla.getObservaciones())
                .activa(plantilla.getActiva())
                .creadoPorId(plantilla.getCreadoPor().getId())
                .creadoPorNombre(plantilla.getCreadoPor().getUsername())
                .fechaCreacion(plantilla.getFechaCreacion())
                .fechaModificacion(plantilla.getFechaModificacion())
                .build();
    }
}
