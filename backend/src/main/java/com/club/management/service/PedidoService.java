package com.club.management.service;

import com.club.management.dto.pedido.*;
import com.club.management.dto.request.MovimientoStockFormData;
import com.club.management.dto.request.TransaccionRequest;
import com.club.management.entity.*;
import com.club.management.entity.Transaccion.TipoTransaccion;
import com.club.management.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaTransaccionRepository categoriaTransaccionRepository;
    private final MovimientoStockService movimientoStockService;
    private final TransaccionService transaccionService;

    /**
     * Crear un nuevo pedido
     */
    @Transactional
    public PedidoDTO crearPedido(CrearPedidoRequest request, Long usuarioId) {
        log.info("Creando pedido para proveedor ID: {}", request.getProveedorId());

        // Validar proveedor existe
        Proveedor proveedor = proveedorRepository.findById(request.getProveedorId())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        // Validar usuario existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Crear pedido
        Pedido pedido = new Pedido();
        pedido.setProveedor(proveedor);
        pedido.setUsuario(usuario);
        pedido.setEstado(EstadoPedido.BORRADOR);
        pedido.setFechaPedido(LocalDateTime.now());
        pedido.setFechaEsperada(request.getFechaEsperada());
        pedido.setNotas(request.getNotas());

        // Agregar detalles
        for (DetallePedidoRequest detalleRequest : request.getDetalles()) {
            Producto producto = productoRepository.findById(detalleRequest.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalleRequest.getProductoId()));

            DetallePedido detalle = new DetallePedido();
            detalle.setProducto(producto);
            detalle.setCantidadPedida(detalleRequest.getCantidad());
            detalle.setPrecioUnitario(detalleRequest.getPrecioUnitario());
            detalle.setNotas(detalleRequest.getNotas());
            detalle.calcularSubtotal();

            pedido.addDetalle(detalle);
        }

        // Calcular totales
        pedido.calcularTotales();

        // Guardar
        Pedido pedidoGuardado = pedidoRepository.save(pedido);
        log.info("Pedido creado con ID: {} y número: {}", pedidoGuardado.getId(), pedidoGuardado.getNumeroPedido());

        return convertirAPedidoDTO(pedidoGuardado);
    }

    /**
     * Obtener todos los pedidos
     */
    public List<PedidoDTO> obtenerTodos() {
        return pedidoRepository.findAll().stream()
                .map(this::convertirAPedidoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener pedido por ID
     */
    public PedidoDTO obtenerPorId(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        return convertirAPedidoDTO(pedido);
    }

    /**
     * Obtener pedidos por estado
     */
    public List<PedidoDTO> obtenerPorEstado(EstadoPedido estado) {
        return pedidoRepository.findByEstadoOrderByFechaPedidoDesc(estado).stream()
                .map(this::convertirAPedidoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener pedidos pendientes de recepción
     */
    public List<PedidoDTO> obtenerPendientesRecepcion() {
        return pedidoRepository.findPedidosPendientesRecepcion().stream()
                .map(this::convertirAPedidoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Actualizar estado de un pedido
     */
    @Transactional
    public PedidoDTO actualizarEstado(Long id, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        pedido.setEstado(nuevoEstado);
        Pedido pedidoActualizado = pedidoRepository.save(pedido);

        log.info("Pedido {} actualizado a estado: {}", id, nuevoEstado);
        return convertirAPedidoDTO(pedidoActualizado);
    }

    /**
     * Recepcionar un pedido
     * - Actualiza cantidades recibidas
     * - Crea movimientos de stock (ENTRADA) para cada producto
     * - Registra gasto automático
     * - Cambia estado del pedido
     */
    @Transactional
    public PedidoDTO recepcionarPedido(Long id, RecepcionarPedidoRequest request, Long usuarioId) {
        log.info("Recepcionando pedido ID: {}", id);

        // Obtener pedido
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        // Validar que se puede recepcionar
        if (!pedido.getIsPuedeRecepcionar()) {
            throw new RuntimeException("El pedido no puede ser recepcionado en su estado actual: " + pedido.getEstado());
        }

        // Obtener usuario que recepciona
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Actualizar cantidades recibidas
        for (RecepcionarPedidoRequest.DetalleRecepcionRequest detalleRecepcion : request.getDetallesRecepcion()) {
            DetallePedido detalle = detallePedidoRepository.findById(detalleRecepcion.getDetalleId())
                    .orElseThrow(() -> new RuntimeException("Detalle de pedido no encontrado"));

            detalle.setCantidadRecibida(detalleRecepcion.getCantidadRecibida());
            if (detalleRecepcion.getNotas() != null) {
                detalle.setNotas(detalleRecepcion.getNotas());
            }
            detallePedidoRepository.save(detalle);

            // Crear movimiento de stock (ENTRADA)
            if (detalleRecepcion.getCantidadRecibida().compareTo(BigDecimal.ZERO) > 0) {
                String motivo = String.format("Recepción pedido %s - %s",
                        pedido.getNumeroPedido(),
                        pedido.getProveedor().getNombre());

                MovimientoStockFormData movimientoData = new MovimientoStockFormData();
                movimientoData.setProductoId(detalle.getProducto().getId());
                movimientoData.setTipoMovimiento("ENTRADA");
                movimientoData.setCantidad(detalleRecepcion.getCantidadRecibida());
                movimientoData.setMotivo(motivo);
                movimientoData.setPrecioUnitario(detalle.getPrecioUnitario());
                movimientoData.setProveedorId(pedido.getProveedor().getId());
                movimientoData.setFechaMovimiento(LocalDateTime.now());

                movimientoStockService.registrarMovimiento(movimientoData);

                log.info("Movimiento de stock creado: producto {} +{} unidades",
                        detalle.getProducto().getNombre(), detalleRecepcion.getCantidadRecibida());
            }
        }

        // Actualizar estado del pedido
        pedido.setFechaRecepcion(LocalDateTime.now());
        pedido.setRecepcionadoPor(usuario);

        if (pedido.getIsCompletamenteRecibido()) {
            pedido.setEstado(EstadoPedido.RECIBIDO);
            log.info("Pedido {} completamente recibido", id);
        } else if (pedido.getIsParcialmenteRecibido()) {
            pedido.setEstado(EstadoPedido.PARCIAL);
            log.info("Pedido {} parcialmente recibido", id);
        }

        // Crear transacción financiera (GASTO)
        try {
            // Buscar o crear categoría "Compras a Proveedores"
            CategoriaTransaccion categoriaCompras = categoriaTransaccionRepository
                    .findByNombreAndTipo("Compras a Proveedores", CategoriaTransaccion.TipoTransaccion.GASTO);

            if (categoriaCompras == null) {
                categoriaCompras = new CategoriaTransaccion();
                categoriaCompras.setNombre("Compras a Proveedores");
                categoriaCompras.setTipo(CategoriaTransaccion.TipoTransaccion.GASTO);
                categoriaCompras.setDescripcion("Gastos por compras a proveedores");
                categoriaCompras = categoriaTransaccionRepository.save(categoriaCompras);
            }

            TransaccionRequest transaccionRequest = new TransaccionRequest();
            transaccionRequest.setTipo(TipoTransaccion.GASTO);
            transaccionRequest.setCategoriaId(categoriaCompras.getId());
            transaccionRequest.setMonto(pedido.getTotal());
            transaccionRequest.setDescripcion("Compra pedido " + pedido.getNumeroPedido() + " - " + pedido.getProveedor().getNombre());
            transaccionRequest.setFecha(LocalDate.now());
            transaccionRequest.setProveedorId(pedido.getProveedor().getId());

            transaccionService.create(transaccionRequest);

            log.info("Transacción financiera creada para pedido {}: {} EUR", id, pedido.getTotal());
        } catch (Exception e) {
            log.error("Error al crear transacción financiera para pedido {}: {}", id, e.getMessage());
            // No falla la recepción si falla la transacción
        }

        // Guardar pedido actualizado
        Pedido pedidoRecepcionado = pedidoRepository.save(pedido);

        return convertirAPedidoDTO(pedidoRecepcionado);
    }

    /**
     * Cancelar un pedido
     */
    @Transactional
    public PedidoDTO cancelarPedido(Long id, String motivo) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (!pedido.getIsPuedeCancelar()) {
            throw new RuntimeException("El pedido no puede ser cancelado en su estado actual: " + pedido.getEstado());
        }

        pedido.setEstado(EstadoPedido.CANCELADO);
        if (motivo != null) {
            String notasActuales = pedido.getNotas() != null ? pedido.getNotas() + "\n" : "";
            pedido.setNotas(notasActuales + "CANCELADO: " + motivo);
        }

        Pedido pedidoCancelado = pedidoRepository.save(pedido);
        log.info("Pedido {} cancelado. Motivo: {}", id, motivo);

        return convertirAPedidoDTO(pedidoCancelado);
    }

    /**
     * Eliminar pedido (solo si está en BORRADOR o CANCELADO)
     */
    @Transactional
    public void eliminarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (pedido.getEstado() != EstadoPedido.BORRADOR && pedido.getEstado() != EstadoPedido.CANCELADO) {
            throw new RuntimeException("Solo se pueden eliminar pedidos en estado BORRADOR o CANCELADO");
        }

        pedidoRepository.delete(pedido);
        log.info("Pedido {} eliminado", id);
    }

    // ========== MÉTODOS DE CONVERSIÓN ==========

    /**
     * Convertir Pedido entity a PedidoDTO
     */
    private PedidoDTO convertirAPedidoDTO(Pedido pedido) {
        return PedidoDTO.builder()
                .id(pedido.getId())
                .numeroPedido(pedido.getNumeroPedido())
                .proveedorId(pedido.getProveedor().getId())
                .proveedorNombre(pedido.getProveedor().getNombre())
                .proveedorContacto(pedido.getProveedor().getContacto())
                .estado(pedido.getEstado())
                .estadoDisplay(pedido.getEstado().getDisplayName())
                .fechaPedido(pedido.getFechaPedido())
                .fechaEsperada(pedido.getFechaEsperada())
                .fechaRecepcion(pedido.getFechaRecepcion())
                .subtotal(pedido.getSubtotal())
                .impuestos(pedido.getImpuestos())
                .total(pedido.getTotal())
                .usuarioId(pedido.getUsuario().getId())
                .usuarioNombre(pedido.getUsuario().getNombre())
                .recepcionadoPorId(pedido.getRecepcionadoPor() != null ? pedido.getRecepcionadoPor().getId() : null)
                .recepcionadoPorNombre(pedido.getRecepcionadoPor() != null ? pedido.getRecepcionadoPor().getNombre() : null)
                .transaccionId(pedido.getTransaccion() != null ? pedido.getTransaccion().getId() : null)
                .notas(pedido.getNotas())
                .detalles(pedido.getDetalles().stream()
                        .map(this::convertirADetallePedidoDTO)
                        .collect(Collectors.toList()))
                .cantidadTotal(pedido.getCantidadTotal())
                .cantidadRecibida(pedido.getCantidadRecibida())
                .puedeEditar(pedido.getIsPuedeEditar())
                .puedeRecepcionar(pedido.getIsPuedeRecepcionar())
                .puedeCancelar(pedido.getIsPuedeCancelar())
                .completamenteRecibido(pedido.getIsCompletamenteRecibido())
                .parcialmenteRecibido(pedido.getIsParcialmenteRecibido())
                .createdAt(pedido.getCreatedAt())
                .updatedAt(pedido.getUpdatedAt())
                .build();
    }

    /**
     * Convertir DetallePedido entity a DetallePedidoDTO
     */
    private DetallePedidoDTO convertirADetallePedidoDTO(DetallePedido detalle) {
        return DetallePedidoDTO.builder()
                .id(detalle.getId())
                .productoId(detalle.getProducto().getId())
                .productoNombre(detalle.getProducto().getNombre())
                .productoCategoria(detalle.getProducto().getCategoria())
                .cantidadPedida(detalle.getCantidadPedida())
                .cantidadRecibida(detalle.getCantidadRecibida())
                .diferencia(detalle.getDiferencia())
                .precioUnitario(detalle.getPrecioUnitario())
                .subtotal(detalle.getSubtotal())
                .notas(detalle.getNotas())
                .completamenteRecibido(detalle.getIsCompletamenteRecibido())
                .parcialmenteRecibido(detalle.getIsParcialmenteRecibido())
                .porcentajeRecibido(detalle.getPorcentajeRecibido())
                .build();
    }
}
