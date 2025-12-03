package com.club.management.service;

import com.club.management.dto.request.CerrarSesionRequest;
import com.club.management.dto.request.RegistrarConsumoRequest;
import com.club.management.dto.request.SesionVentaRequest;
import com.club.management.dto.response.ConsumoSesionDTO;
import com.club.management.dto.response.SesionVentaDTO;
import com.club.management.entity.*;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SesionVentaService {

    private final SesionVentaRepository sesionRepository;
    private final ConsumoSesionRepository consumoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public SesionVentaDTO crearSesion(SesionVentaRequest request) {
        log.info("Creando nueva sesión de venta: {}", request.getNombre());

        // Generar código único
        String codigo = generarCodigoSesion();

        // Obtener empleado si se especificó
        Empleado empleado = null;
        if (request.getEmpleadoId() != null) {
            empleado = empleadoRepository.findById(request.getEmpleadoId())
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + request.getEmpleadoId()));
        }

        // Crear sesión
        SesionVenta sesion = SesionVenta.builder()
                .codigo(codigo)
                .nombre(request.getNombre())
                .estado(SesionVenta.EstadoSesion.ABIERTA)
                .empleado(empleado)
                .valorTotal(BigDecimal.ZERO)
                .totalItems(BigDecimal.ZERO)
                .fechaApertura(LocalDateTime.now())
                .notas(request.getNotas())
                .creadoPor(getCurrentUsername())
                .build();

        sesion = sesionRepository.save(sesion);
        log.info("Sesión creada exitosamente con código: {}", codigo);

        return toDTO(sesion);
    }

    @Transactional(readOnly = true)
    public List<SesionVentaDTO> listarSesiones() {
        return sesionRepository.findAllByOrderByFechaAperturaDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SesionVentaDTO> listarSesionesAbiertas() {
        return sesionRepository.findByEstadoOrderByFechaAperturaDesc(SesionVenta.EstadoSesion.ABIERTA).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SesionVentaDTO obtenerSesion(Long id) {
        SesionVenta sesion = sesionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada con ID: " + id));
        return toDTO(sesion);
    }

    @Transactional
    public ConsumoSesionDTO registrarConsumo(Long sesionId, RegistrarConsumoRequest request) {
        log.info("Registrando consumo en sesión {}: producto {} x {}", sesionId, request.getProductoId(), request.getCantidad());

        // Validar sesión
        SesionVenta sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada con ID: " + sesionId));

        if (sesion.getEstado() != SesionVenta.EstadoSesion.ABIERTA) {
            throw new RuntimeException("No se pueden registrar consumos en una sesión " + sesion.getEstado());
        }

        // Validar producto
        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + request.getProductoId()));

        // Validar stock disponible
        validarStockDisponible(producto, request.getCantidad());

        // Calcular subtotal
        BigDecimal subtotal = producto.getPrecioVenta().multiply(request.getCantidad());

        // Crear consumo
        ConsumoSesion consumo = ConsumoSesion.builder()
                .sesion(sesion)
                .producto(producto)
                .productoId(producto.getId())
                .productoNombre(producto.getNombre())
                .cantidad(request.getCantidad())
                .precioUnitario(producto.getPrecioVenta())
                .subtotal(subtotal)
                .tipoVenta(producto.getTipoVenta() != null ? producto.getTipoVenta().name() : null)
                .notas(request.getNotas())
                .fechaRegistro(LocalDateTime.now())
                .registradoPor(getCurrentUsername())
                .build();

        consumo = consumoRepository.save(consumo);

        // NOTA: El stock se descuenta automáticamente por el trigger descontar_stock_consumo()
        // NOTA: Los totales de la sesión se actualizan automáticamente por el trigger actualizar_totales_sesion()

        log.info("Consumo registrado exitosamente. ID: {}", consumo.getId());

        return toConsumoDTO(consumo);
    }

    @Transactional(readOnly = true)
    public List<ConsumoSesionDTO> listarConsumosDeSesion(Long sesionId) {
        // Validar que la sesión existe
        if (!sesionRepository.existsById(sesionId)) {
            throw new RuntimeException("Sesión no encontrada con ID: " + sesionId);
        }

        return consumoRepository.findBySesionIdOrderByFechaRegistroDesc(sesionId).stream()
                .map(this::toConsumoDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SesionVentaDTO cerrarSesion(Long sesionId, CerrarSesionRequest request) {
        log.info("Cerrando sesión ID: {}", sesionId);

        SesionVenta sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada con ID: " + sesionId));

        if (sesion.getEstado() != SesionVenta.EstadoSesion.ABIERTA) {
            throw new RuntimeException("La sesión ya está " + sesion.getEstado());
        }

        // Actualizar estado y fecha de cierre
        sesion.setEstado(SesionVenta.EstadoSesion.CERRADA);
        sesion.setFechaCierre(LocalDateTime.now());

        // Agregar notas de cierre si se proporcionaron
        if (request != null && request.getNotas() != null && !request.getNotas().isBlank()) {
            String notasActuales = sesion.getNotas() != null ? sesion.getNotas() : "";
            sesion.setNotas(notasActuales + "\nCierre: " + request.getNotas());
        }

        sesion = sesionRepository.save(sesion);

        // Calcular duración en minutos para el DTO
        long minutos = Duration.between(sesion.getFechaApertura(), sesion.getFechaCierre()).toMinutes();

        log.info("Sesión {} cerrada exitosamente. Duración: {} minutos, Total: €{}",
                sesion.getCodigo(), minutos, sesion.getValorTotal());

        SesionVentaDTO dto = toDTO(sesion);
        dto.setDuracionMinutos((int) minutos);
        return dto;
    }

    // Métodos auxiliares

    private String generarCodigoSesion() {
        Integer maxNumero = sesionRepository.findMaxCodigoNumber();
        int siguienteNumero = (maxNumero != null ? maxNumero : 0) + 1;
        return String.format("SV-%03d", siguienteNumero);
    }

    private void validarStockDisponible(Producto producto, BigDecimal cantidadSolicitada) {
        BigDecimal stockDisponible;

        if (producto.isVentaPorServicio()) {
            // Para copas/chupitos, usar servicios disponibles (stock × unidades por botella)
            stockDisponible = producto.getServiciosDisponibles();
        } else {
            // Para botellas/unidades, usar stock actual
            stockDisponible = producto.getStockActual();
        }

        if (stockDisponible.compareTo(cantidadSolicitada) < 0) {
            throw new RuntimeException(
                String.format("Stock insuficiente para '%s'. Disponible: %.2f, Solicitado: %.2f",
                    producto.getNombre(), stockDisponible, cantidadSolicitada)
            );
        }
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }

    private SesionVentaDTO toDTO(SesionVenta sesion) {
        return SesionVentaDTO.builder()
                .id(sesion.getId())
                .codigo(sesion.getCodigo())
                .nombre(sesion.getNombre())
                .estado(sesion.getEstado().name())
                .empleadoId(sesion.getEmpleado() != null ? sesion.getEmpleado().getId() : null)
                .empleadoNombre(sesion.getEmpleado() != null ? sesion.getEmpleado().getNombre() + " " + sesion.getEmpleado().getApellidos() : null)
                .valorTotal(sesion.getValorTotal())
                .totalItems(sesion.getTotalItems())
                .duracionMinutos(sesion.getDuracionMinutos())
                .fechaApertura(sesion.getFechaApertura())
                .fechaCierre(sesion.getFechaCierre())
                .notas(sesion.getNotas())
                .creadoPor(sesion.getCreadoPor())
                .cerradoPor(sesion.getCerradoPor())
                .build();
    }

    private ConsumoSesionDTO toConsumoDTO(ConsumoSesion consumo) {
        return ConsumoSesionDTO.builder()
                .id(consumo.getId())
                .sesionId(consumo.getSesion().getId())
                .productoId(consumo.getProductoId())
                .productoNombre(consumo.getProductoNombre())
                .cantidad(consumo.getCantidad())
                .precioUnitario(consumo.getPrecioUnitario())
                .subtotal(consumo.getSubtotal())
                .tipoVenta(consumo.getTipoVenta())
                .notas(consumo.getNotas())
                .fechaRegistro(consumo.getFechaRegistro())
                .registradoPor(consumo.getRegistradoPor())
                .build();
    }
}
