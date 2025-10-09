package com.club.management.service;

import com.club.management.dto.request.MovimientoStockFormData;
import com.club.management.dto.response.MovimientoStockDTO;
import com.club.management.entity.*;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovimientoStockService {

    private final MovimientoStockRepository movimientoRepository;
    private final ProductoRepository productoRepository;
    private final EventoRepository eventoRepository;
    private final ProveedorRepository proveedorRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<MovimientoStockDTO> getAllMovimientos() {
        return movimientoRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MovimientoStockDTO> getMovimientosByProducto(Long productoId) {
        return movimientoRepository.findByProductoIdOrderByFechaMovimientoDesc(productoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MovimientoStockDTO> getMovimientosByEvento(Long eventoId) {
        return movimientoRepository.findByEventoId(eventoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MovimientoStockDTO> getMovimientosByTipo(String tipo) {
        return movimientoRepository.findByTipoMovimiento(tipo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MovimientoStockDTO> getMovimientosByFechaRange(LocalDateTime desde, LocalDateTime hasta) {
        return movimientoRepository.findByFechaMovimientoBetween(desde, hasta).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MovimientoStockDTO> getMovimientosByProductoAndFecha(Long productoId, LocalDateTime desde, LocalDateTime hasta) {
        return movimientoRepository.findByProductoAndFechaBetween(productoId, desde, hasta).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MovimientoStockDTO registrarMovimiento(MovimientoStockFormData formData) {
        // Validaciones
        if (formData.getCantidad() == null || formData.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a cero");
        }

        Producto producto = productoRepository.findById(formData.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        MovimientoStock movimiento = new MovimientoStock();
        movimiento.setProducto(producto);
        movimiento.setTipoMovimiento(formData.getTipoMovimiento());
        movimiento.setCantidad(formData.getCantidad());
        movimiento.setStockAnterior(producto.getStockActual());
        movimiento.setPrecioUnitario(formData.getPrecioUnitario());
        movimiento.setMotivo(formData.getMotivo());
        movimiento.setReferencia(formData.getReferencia());
        movimiento.setFechaMovimiento(formData.getFechaMovimiento() != null ?
                formData.getFechaMovimiento() : LocalDateTime.now());
        movimiento.setNotas(formData.getNotas());

        // Calcular nuevo stock según tipo de movimiento
        BigDecimal nuevoStock = calcularNuevoStock(producto.getStockActual(),
                formData.getCantidad(), formData.getTipoMovimiento());

        // Validar que el stock no sea negativo (excepto para AJUSTE que puede establecer cualquier valor)
        if (!formData.getTipoMovimiento().equals("AJUSTE") && nuevoStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Stock insuficiente. Stock actual: " + producto.getStockActual() +
                                      " " + producto.getUnidadMedida() + ", intentando retirar: " +
                                      formData.getCantidad() + " " + producto.getUnidadMedida());
        }

        movimiento.setStockNuevo(nuevoStock);

        // Calcular costo total
        if (formData.getPrecioUnitario() != null) {
            movimiento.setCostoTotal(formData.getPrecioUnitario().multiply(formData.getCantidad()));
        }

        // Relacionar con evento si existe
        if (formData.getEventoId() != null) {
            Evento evento = eventoRepository.findById(formData.getEventoId())
                    .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
            movimiento.setEvento(evento);
        }

        // Relacionar con proveedor si existe
        if (formData.getProveedorId() != null) {
            Proveedor proveedor = proveedorRepository.findById(formData.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
            movimiento.setProveedor(proveedor);
        }

        // Asignar usuario actual
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null) {
            String username = authentication.getName();
            Usuario usuario = usuarioRepository.findByUsername(username)
                    .orElse(null);
            movimiento.setUsuario(usuario);
        }

        // Actualizar stock del producto
        producto.setStockActual(nuevoStock);
        productoRepository.save(producto);

        MovimientoStock saved = movimientoRepository.save(movimiento);
        return toDTO(saved);
    }

    private BigDecimal calcularNuevoStock(BigDecimal stockActual, BigDecimal cantidad, String tipoMovimiento) {
        return switch (tipoMovimiento) {
            case "ENTRADA", "DEVOLUCION" -> stockActual.add(cantidad);
            case "SALIDA", "MERMA" -> stockActual.subtract(cantidad);
            case "AJUSTE" -> cantidad; // El ajuste establece el stock en el valor indicado
            default -> stockActual;
        };
    }

    private MovimientoStockDTO toDTO(MovimientoStock mov) {
        MovimientoStockDTO dto = new MovimientoStockDTO();
        dto.setId(mov.getId());
        dto.setProductoId(mov.getProducto().getId());
        dto.setProductoNombre(mov.getProducto().getNombre());
        dto.setProductoCodigo(mov.getProducto().getCodigo());
        dto.setTipoMovimiento(mov.getTipoMovimiento());
        dto.setCantidad(mov.getCantidad());
        dto.setStockAnterior(mov.getStockAnterior());
        dto.setStockNuevo(mov.getStockNuevo());
        dto.setPrecioUnitario(mov.getPrecioUnitario());
        dto.setCostoTotal(mov.getCostoTotal());
        dto.setMotivo(mov.getMotivo());
        dto.setReferencia(mov.getReferencia());
        dto.setFechaMovimiento(mov.getFechaMovimiento());
        dto.setNotas(mov.getNotas());
        dto.setCreadoEn(mov.getCreadoEn());

        if (mov.getEvento() != null) {
            dto.setEventoId(mov.getEvento().getId());
            dto.setEventoNombre(mov.getEvento().getNombre());
        }
        if (mov.getProveedor() != null) {
            dto.setProveedorId(mov.getProveedor().getId());
            dto.setProveedorNombre(mov.getProveedor().getNombre());
        }
        if (mov.getUsuario() != null) {
            dto.setUsuarioNombre(mov.getUsuario().getUsername());
        }

        return dto;
    }
}
