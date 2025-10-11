package com.club.management.service;

import com.club.management.dto.DetalleVentaDTO;
import com.club.management.dto.VentaDTO;
import com.club.management.dto.VentaRequest;
import com.club.management.entity.*;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de ventas del POS
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VentaService {

    private final VentaRepository ventaRepository;
    private final SesionCajaRepository sesionCajaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final ProductoRepository productoRepository;
    private final EventoRepository eventoRepository;

    @Transactional(readOnly = true)
    public List<VentaDTO> findAll() {
        return ventaRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VentaDTO findById(Long id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada con id: " + id));
        return toDTO(venta);
    }

    @Transactional(readOnly = true)
    public VentaDTO findByNumeroTicket(String numeroTicket) {
        Venta venta = ventaRepository.findByNumeroTicket(numeroTicket)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada con número de ticket: " + numeroTicket));
        return toDTO(venta);
    }

    @Transactional(readOnly = true)
    public List<VentaDTO> findBySesionCajaId(Long sesionCajaId) {
        return ventaRepository.findAllBySesionCajaId(sesionCajaId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VentaDTO> findByEmpleadoId(Long empleadoId) {
        return ventaRepository.findAllByEmpleadoId(empleadoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VentaDTO> findByEventoId(Long eventoId) {
        return ventaRepository.findAllByEventoId(eventoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VentaDTO> findEntreFechas(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return ventaRepository.findVentasEntreFechas(fechaInicio, fechaFin).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crea una nueva venta con todos sus detalles
     */
    @Transactional
    public VentaDTO crearVenta(VentaRequest request) {
        log.info("Creando venta para sesión de caja: {}", request.getSesionCajaId());

        // 1. Validar sesión de caja
        SesionCaja sesion = sesionCajaRepository.findById(request.getSesionCajaId())
                .orElseThrow(() -> new RuntimeException("Sesión de caja no encontrada con id: " + request.getSesionCajaId()));

        if (sesion.getEstado() != SesionCaja.EstadoSesionCaja.ABIERTA) {
            throw new RuntimeException("La sesión de caja está cerrada. No se pueden registrar ventas.");
        }

        // 2. Validar empleado
        Empleado empleado = empleadoRepository.findById(request.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + request.getEmpleadoId()));

        // 3. Validar evento si se especifica
        Evento evento = null;
        if (request.getEventoId() != null) {
            evento = eventoRepository.findById(request.getEventoId())
                    .orElseThrow(() -> new RuntimeException("Evento no encontrado con id: " + request.getEventoId()));
        }

        // 4. Crear venta
        Venta venta = Venta.builder()
                .sesionCaja(sesion)
                .empleado(empleado)
                .evento(evento)
                .metodoPago(request.getMetodoPago())
                .montoEfectivo(request.getMontoEfectivo())
                .montoTarjeta(request.getMontoTarjeta())
                .clienteNombre(request.getClienteNombre())
                .observaciones(request.getObservaciones())
                .fecha(LocalDateTime.now())
                .subtotal(BigDecimal.ZERO)
                .descuento(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .detalles(new ArrayList<>())
                .build();

        // 5. Crear detalles de venta
        for (VentaRequest.DetalleVentaRequest detalleReq : request.getDetalles()) {
            // Obtener producto
            Producto producto = productoRepository.findById(detalleReq.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + detalleReq.getProductoId()));

            // Validar que el producto esté activo
            if (producto.getActivo() != null && !producto.getActivo()) {
                throw new RuntimeException("El producto '" + producto.getNombre() + "' no está activo");
            }

            // Crear detalle
            DetalleVenta detalle = DetalleVenta.builder()
                    .producto(producto)
                    .cantidad(detalleReq.getCantidad())
                    .precioUnitario(detalleReq.getPrecioUnitario() != null ?
                            detalleReq.getPrecioUnitario() : producto.getPrecioVenta())
                    .descuento(detalleReq.getDescuento())
                    .build();

            // Validar stock disponible
            detalle.validarStock();

            // Calcular totales del detalle
            detalle.calcularTotales();

            // Agregar detalle a la venta
            venta.addDetalle(detalle);
        }

        // 6. Recalcular totales de la venta
        venta.recalcularTotales();

        // 7. Validar montos de pago
        venta.validarMontosPago();

        // 8. Guardar venta (esto dispara el trigger que crea la transacción y descuenta stock)
        Venta saved = ventaRepository.save(venta);

        log.info("Venta creada exitosamente: ticket={}, total={}", saved.getNumeroTicket(), saved.getTotal());

        return toDTO(saved);
    }

    /**
     * Convierte entidad a DTO
     */
    private VentaDTO toDTO(Venta venta) {
        List<DetalleVentaDTO> detallesDTO = venta.getDetalles() != null ?
                venta.getDetalles().stream()
                        .map(this::detalleToDTO)
                        .collect(Collectors.toList()) : new ArrayList<>();

        return VentaDTO.builder()
                .id(venta.getId())
                .numeroTicket(venta.getNumeroTicket())
                .fecha(venta.getFecha())
                .subtotal(venta.getSubtotal())
                .descuento(venta.getDescuento())
                .total(venta.getTotal())
                .metodoPago(venta.getMetodoPago())
                .montoEfectivo(venta.getMontoEfectivo())
                .montoTarjeta(venta.getMontoTarjeta())
                .sesionCajaId(venta.getSesionCaja().getId())
                .sesionCajaNombre(venta.getSesionCaja().getNombreCaja())
                .empleadoId(venta.getEmpleado().getId())
                .empleadoNombre(venta.getEmpleado().getNombre())
                .eventoId(venta.getEvento() != null ? venta.getEvento().getId() : null)
                .eventoNombre(venta.getEvento() != null ? venta.getEvento().getNombre() : null)
                .clienteNombre(venta.getClienteNombre())
                .observaciones(venta.getObservaciones())
                .detalles(detallesDTO)
                .createdAt(venta.getCreatedAt())
                .build();
    }

    /**
     * Convierte detalle de venta a DTO
     */
    private DetalleVentaDTO detalleToDTO(DetalleVenta detalle) {
        return DetalleVentaDTO.builder()
                .id(detalle.getId())
                .productoId(detalle.getProducto().getId())
                .productoNombre(detalle.getProducto().getNombre())
                .productoCategoria(detalle.getProducto().getCategoria())
                .cantidad(detalle.getCantidad())
                .precioUnitario(detalle.getPrecioUnitario())
                .subtotal(detalle.getSubtotal())
                .descuento(detalle.getDescuento())
                .total(detalle.getTotal())
                .build();
    }
}
