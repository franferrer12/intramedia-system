package com.club.management.service;

import com.club.management.dto.*;
import com.club.management.entity.BotellaAbierta;
import com.club.management.entity.BotellaAbierta.EstadoBotella;
import com.club.management.entity.Empleado;
import com.club.management.entity.Producto;
import com.club.management.entity.SesionCaja;
import com.club.management.repository.BotellaAbiertaRepository;
import com.club.management.repository.EmpleadoRepository;
import com.club.management.repository.ProductoRepository;
import com.club.management.repository.SesionCajaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BotellaAbiertaService {

    private final BotellaAbiertaRepository botellaAbiertaRepository;
    private final ProductoRepository productoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SesionCajaRepository sesionCajaRepository;

    // ========== OPERACIONES CRUD ==========

    /**
     * Obtener todas las botellas abiertas (estado ABIERTA)
     */
    @Transactional(readOnly = true)
    public List<BotellaAbiertaDTO> getBotellasAbiertas() {
        return botellaAbiertaRepository.findByEstadoWithDetails(EstadoBotella.ABIERTA).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener todas las botellas (incluye cerradas y desperdiciadas)
     */
    @Transactional(readOnly = true)
    public List<BotellaAbiertaDTO> getAllBotellas() {
        return botellaAbiertaRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener una botella por ID
     */
    @Transactional(readOnly = true)
    public BotellaAbiertaDTO getBotellaById(Long id) {
        BotellaAbierta botella = botellaAbiertaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Botella no encontrada con ID: " + id));
        return toDTO(botella);
    }

    /**
     * Obtener botellas abiertas de un producto específico
     */
    @Transactional(readOnly = true)
    public List<BotellaAbiertaDTO> getBotellasPorProducto(Long productoId) {
        return botellaAbiertaRepository.findByProductoIdAndEstado(productoId, EstadoBotella.ABIERTA).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener botellas abiertas por ubicación
     */
    @Transactional(readOnly = true)
    public List<BotellaAbiertaDTO> getBotellasPorUbicacion(String ubicacion) {
        return botellaAbiertaRepository.findByUbicacionAndEstado(ubicacion, EstadoBotella.ABIERTA).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener botellas con alertas (casi vacías o abiertas más de 24h)
     */
    @Transactional(readOnly = true)
    public List<BotellaAbiertaDTO> getBotellasConAlertas() {
        LocalDateTime hace24Horas = LocalDateTime.now().minusHours(24);
        return botellaAbiertaRepository.findBotellasConAlertas(hace24Horas).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ========== OPERACIONES DE NEGOCIO ==========

    /**
     * Abrir una nueva botella
     */
    @Transactional
    public BotellaAbiertaDTO abrirBotella(AbrirBotellaRequest request) {
        log.info("Abriendo botella - Producto ID: {}, Ubicación: {}", request.getProductoId(), request.getUbicacion());

        // Validar producto
        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + request.getProductoId()));

        if (!Boolean.TRUE.equals(producto.getEsBotella())) {
            throw new RuntimeException("El producto '" + producto.getNombre() + "' no es una botella");
        }

        producto.validarConfiguracionBotella();

        // Validar stock disponible
        if (producto.getStockActual().compareTo(BigDecimal.ONE) < 0) {
            throw new RuntimeException("No hay stock disponible de '" + producto.getNombre() +
                "'. Stock actual: " + producto.getStockActual());
        }

        // Validar empleado
        Empleado empleado = empleadoRepository.findById(request.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + request.getEmpleadoId()));

        // Validar sesión de caja (opcional)
        SesionCaja sesionCaja = null;
        if (request.getSesionCajaId() != null) {
            sesionCaja = sesionCajaRepository.findById(request.getSesionCajaId())
                    .orElseThrow(() -> new RuntimeException("Sesión de caja no encontrada con ID: " + request.getSesionCajaId()));
        }

        // Crear botella abierta
        BotellaAbierta botella = BotellaAbierta.builder()
                .producto(producto)
                .sesionCaja(sesionCaja)
                .ubicacion(request.getUbicacion().toUpperCase())
                .copasTotales(producto.getCopasPorBotella())
                .copasServidas(0)
                .copasRestantes(producto.getCopasPorBotella())
                .fechaApertura(LocalDateTime.now())
                .estado(EstadoBotella.ABIERTA)
                .abiertaPor(empleado)
                .notas(request.getNotas())
                .build();

        // El trigger de la BD descontará automáticamente el stock
        BotellaAbierta saved = botellaAbiertaRepository.save(botella);

        log.info("Botella abierta exitosamente - ID: {}, Producto: {}, Copas disponibles: {}",
            saved.getId(), producto.getNombre(), saved.getCopasRestantes());

        return toDTO(saved);
    }

    /**
     * Cerrar una botella manualmente
     */
    @Transactional
    public BotellaAbiertaDTO cerrarBotella(CerrarBotellaRequest request) {
        log.info("Cerrando botella - ID: {}, Motivo: {}", request.getBotellaId(), request.getMotivo());

        // Validar botella
        BotellaAbierta botella = botellaAbiertaRepository.findById(request.getBotellaId())
                .orElseThrow(() -> new RuntimeException("Botella no encontrada con ID: " + request.getBotellaId()));

        if (botella.getEstado() != EstadoBotella.ABIERTA) {
            throw new RuntimeException("La botella ya está cerrada con estado: " + botella.getEstado());
        }

        // Validar motivo
        if (request.getMotivo() != EstadoBotella.CERRADA && request.getMotivo() != EstadoBotella.DESPERDICIADA) {
            throw new RuntimeException("Motivo de cierre no válido: " + request.getMotivo());
        }

        // Validar empleado
        Empleado empleado = empleadoRepository.findById(request.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + request.getEmpleadoId()));

        // Cerrar botella
        botella.cerrar(request.getMotivo());
        botella.setCerradaPor(empleado);

        // Agregar notas
        String notasActuales = botella.getNotas() != null ? botella.getNotas() + "\n" : "";
        botella.setNotas(notasActuales + "Cerrada: " + request.getMotivo() +
            (request.getNotas() != null ? " - " + request.getNotas() : ""));

        BotellaAbierta updated = botellaAbiertaRepository.save(botella);

        log.info("Botella cerrada - ID: {}, Estado: {}, Copas servidas: {}/{}",
            updated.getId(), updated.getEstado(), updated.getCopasServidas(), updated.getCopasTotales());

        return toDTO(updated);
    }

    /**
     * Servir copas de una botella (usado internamente por ventas)
     */
    @Transactional
    public BotellaAbiertaDTO servirCopas(Long botellaId, Integer cantidad) {
        log.info("Sirviendo copas - Botella ID: {}, Cantidad: {}", botellaId, cantidad);

        BotellaAbierta botella = botellaAbiertaRepository.findById(botellaId)
                .orElseThrow(() -> new RuntimeException("Botella no encontrada con ID: " + botellaId));

        // El método servirCopas() de la entidad valida todo
        botella.servirCopas(cantidad);

        BotellaAbierta updated = botellaAbiertaRepository.save(botella);

        log.info("Copas servidas - Botella ID: {}, Restantes: {}/{}",
            updated.getId(), updated.getCopasRestantes(), updated.getCopasTotales());

        return toDTO(updated);
    }

    // ========== ESTADÍSTICAS Y REPORTES ==========

    /**
     * Obtener resumen de botellas por producto
     */
    @Transactional(readOnly = true)
    public List<ResumenBotellasDTO> getResumenPorProducto() {
        List<Object[]> stats = botellaAbiertaRepository.estadisticasConsumoPorProducto();

        return stats.stream().map(row -> {
            Long productoId = (Long) row[0];
            String productoNombre = (String) row[1];
            Long totalBotellas = (Long) row[2];
            Long copasServidas = (Long) row[3];
            Long copasDisponibles = (Long) row[4];

            // Obtener detalles adicionales
            List<BotellaAbierta> botellas = botellaAbiertaRepository
                .findByProductoIdAndEstado(productoId, EstadoBotella.ABIERTA);

            List<String> ubicaciones = botellas.stream()
                .map(BotellaAbierta::getUbicacion)
                .distinct()
                .collect(Collectors.toList());

            LocalDateTime masAntigua = botellas.stream()
                .map(BotellaAbierta::getFechaApertura)
                .min(LocalDateTime::compareTo)
                .orElse(null);

            LocalDateTime masReciente = botellas.stream()
                .map(BotellaAbierta::getFechaApertura)
                .max(LocalDateTime::compareTo)
                .orElse(null);

            boolean tieneAlertaCasiVacia = botellas.stream()
                .anyMatch(BotellaAbierta::isCasiVacia);

            boolean tieneAlertaMas24h = botellas.stream()
                .anyMatch(BotellaAbierta::isAbiertaMas24Horas);

            long botellasConAlertas = botellas.stream()
                .filter(b -> b.isCasiVacia() || b.isAbiertaMas24Horas())
                .count();

            return ResumenBotellasDTO.builder()
                .productoId(productoId)
                .productoNombre(productoNombre)
                .totalBotellasAbiertas(totalBotellas)
                .totalCopasServidas(copasServidas.intValue())
                .totalCopasDisponibles(copasDisponibles.intValue())
                .ubicaciones(ubicaciones)
                .botellaMasAntigua(masAntigua)
                .botellaMasReciente(masReciente)
                .tieneAlertaCasiVacia(tieneAlertaCasiVacia)
                .tieneAlertaMas24h(tieneAlertaMas24h)
                .botellasConAlertas((int) botellasConAlertas)
                .build();
        }).collect(Collectors.toList());
    }

    /**
     * Calcular copas disponibles de un producto
     */
    @Transactional(readOnly = true)
    public Integer getCopasDisponibles(Long productoId) {
        return botellaAbiertaRepository.calcularCopasDisponibles(productoId);
    }

    /**
     * Obtener stock total consolidado (cerrado + abierto)
     */
    @Transactional(readOnly = true)
    public List<StockTotalDTO> getStockTotalBotellas() {
        List<Producto> productos = productoRepository.findAll().stream()
            .filter(p -> Boolean.TRUE.equals(p.getEsBotella()))
            .collect(Collectors.toList());

        return productos.stream().map(producto -> {
            Long botellasAbiertas = botellaAbiertaRepository.contarBotellasAbiertas(producto.getId());
            Integer copasDisponibles = botellaAbiertaRepository.calcularCopasDisponibles(producto.getId());

            BigDecimal stockAbiertoEquivalente = BigDecimal.ZERO;
            if (producto.getCopasPorBotella() != null && producto.getCopasPorBotella() > 0) {
                stockAbiertoEquivalente = BigDecimal.valueOf(copasDisponibles)
                    .divide(BigDecimal.valueOf(producto.getCopasPorBotella()), 2, java.math.RoundingMode.HALF_UP);
            }

            BigDecimal stockTotal = producto.getStockActual().add(stockAbiertoEquivalente);

            String nivelStock = "NORMAL";
            if (producto.getStockMinimo() != null && stockTotal.compareTo(producto.getStockMinimo()) <= 0) {
                nivelStock = "BAJO";
            } else if (producto.getStockMaximo() != null && stockTotal.compareTo(producto.getStockMaximo()) >= 0) {
                nivelStock = "ALTO";
            }

            List<String> ubicaciones = botellaAbiertaRepository
                .findByProductoIdAndEstado(producto.getId(), EstadoBotella.ABIERTA).stream()
                .map(BotellaAbierta::getUbicacion)
                .distinct()
                .collect(Collectors.toList());

            return StockTotalDTO.builder()
                .productoId(producto.getId())
                .productoNombre(producto.getNombre())
                .categoria(producto.getCategoria())
                .stockCerradoBotellas(producto.getStockActual())
                .stockAbiertoBotellas(botellasAbiertas)
                .copasDisponibles(copasDisponibles)
                .stockAbiertoEquivalenteBotellas(stockAbiertoEquivalente)
                .stockTotalEquivalente(stockTotal)
                .stockMinimo(producto.getStockMinimo())
                .stockMaximo(producto.getStockMaximo())
                .nivelStock(nivelStock)
                .ubicacionesBotellas(ubicaciones)
                .build();
        }).collect(Collectors.toList());
    }

    // ========== MAPEO A DTO ==========

    private BotellaAbiertaDTO toDTO(BotellaAbierta botella) {
        BigDecimal ingresosGenerados = BigDecimal.ZERO;
        BigDecimal ingresosPerdidos = BigDecimal.ZERO;

        if (botella.getProducto().getPrecioCopa() != null) {
            ingresosGenerados = botella.getProducto().getPrecioCopa()
                .multiply(BigDecimal.valueOf(botella.getCopasServidas()));
            ingresosPerdidos = botella.getProducto().getPrecioCopa()
                .multiply(BigDecimal.valueOf(botella.getCopasRestantes()));
        }

        return BotellaAbiertaDTO.builder()
            .id(botella.getId())
            .productoId(botella.getProducto().getId())
            .productoNombre(botella.getProducto().getNombre())
            .productoCategoria(botella.getProducto().getCategoria())
            .precioCopa(botella.getProducto().getPrecioCopa())
            .sesionCajaId(botella.getSesionCaja() != null ? botella.getSesionCaja().getId() : null)
            .ubicacion(botella.getUbicacion())
            .copasTotales(botella.getCopasTotales())
            .copasServidas(botella.getCopasServidas())
            .copasRestantes(botella.getCopasRestantes())
            .porcentajeConsumido(botella.getPorcentajeConsumido())
            .fechaApertura(botella.getFechaApertura())
            .fechaCierre(botella.getFechaCierre())
            .horasAbierta(botella.getHorasAbierta())
            .estado(botella.getEstado())
            .abiertaPorId(botella.getAbiertaPor() != null ? botella.getAbiertaPor().getId() : null)
            .abiertaPorNombre(botella.getAbiertaPor() != null ? botella.getAbiertaPor().getNombre() : null)
            .cerradaPorId(botella.getCerradaPor() != null ? botella.getCerradaPor().getId() : null)
            .cerradaPorNombre(botella.getCerradaPor() != null ? botella.getCerradaPor().getNombre() : null)
            .ingresosGenerados(ingresosGenerados)
            .ingresosPotencialesPerdidos(ingresosPerdidos)
            .alerta(botella.getNivelAlerta())
            .notas(botella.getNotas())
            .createdAt(botella.getCreatedAt())
            .updatedAt(botella.getUpdatedAt())
            .isCasiVacia(botella.isCasiVacia())
            .isVacia(botella.isVacia())
            .isAbiertaMas24Horas(botella.isAbiertaMas24Horas())
            .build();
    }
}
