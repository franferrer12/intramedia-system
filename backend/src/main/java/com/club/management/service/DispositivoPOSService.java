package com.club.management.service;

import com.club.management.dto.*;
import com.club.management.entity.*;
import com.club.management.exception.ResourceNotFoundException;
import com.club.management.exception.UnauthorizedException;
import com.club.management.repository.*;
import com.club.management.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DispositivoPOSService {

    private final DispositivoPOSRepository dispositivoPOSRepository;
    private final VentaPendienteSyncRepository ventaPendienteSyncRepository;
    private final DispositivoPOSLogRepository logRepository;
    private final EmpleadoRepository empleadoRepository;
    private final ProductoRepository productoRepository;
    private final SesionVentaRepository sesionVentaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // ============================================
    // GESTIÓN DE DISPOSITIVOS
    // ============================================

    @Transactional
    public DispositivoPOSDTO registrar(DispositivoPOSRequest request) {
        // Verificar nombre único
        if (dispositivoPOSRepository.existsByNombre(request.getNombre())) {
            throw new IllegalArgumentException("Ya existe un dispositivo con ese nombre");
        }

        // Generar UUID único
        String uuid = UUID.randomUUID().toString();

        // Cifrar PIN
        String pinCifrado = passwordEncoder.encode(request.getPin());

        // Obtener empleado si fue asignado
        Empleado empleado = null;
        if (request.getEmpleadoAsignadoId() != null) {
            empleado = empleadoRepository.findById(request.getEmpleadoAsignadoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));
        }

        DispositivoPOS dispositivo = DispositivoPOS.builder()
                .uuid(uuid)
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .tipo(request.getTipo())
                .ubicacion(request.getUbicacion())
                .empleadoAsignado(empleado)
                .pinRapido(pinCifrado)
                .categoriasPredeterminadas(request.getCategoriasPredeterminadas())
                .configImpresora(request.getConfigImpresora())
                .tieneLectorBarras(request.getTieneLectorBarras())
                .tieneCajonDinero(request.getTieneCajonDinero())
                .tienePantallaCliente(request.getTienePantallaCliente())
                .permisos(request.getPermisos())
                .activo(true)
                .modoOfflineHabilitado(true)
                .build();

        dispositivo = dispositivoPOSRepository.save(dispositivo);
        log.info("✅ Dispositivo POS registrado: {} (UUID: {})", dispositivo.getNombre(), dispositivo.getUuid());

        return mapToDTO(dispositivo);
    }

    @Transactional(readOnly = true)
    public List<DispositivoPOSDTO> listarTodos() {
        return dispositivoPOSRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DispositivoPOSDTO> listarActivos() {
        return dispositivoPOSRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DispositivoPOSDTO obtenerPorId(Long id) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));
        return mapToDTO(dispositivo);
    }

    @Transactional
    public DispositivoPOSDTO actualizar(Long id, DispositivoPOSRequest request) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        // Verificar nombre único si cambió
        if (!dispositivo.getNombre().equals(request.getNombre()) &&
                dispositivoPOSRepository.existsByNombre(request.getNombre())) {
            throw new IllegalArgumentException("Ya existe un dispositivo con ese nombre");
        }

        dispositivo.setNombre(request.getNombre());
        dispositivo.setDescripcion(request.getDescripcion());
        dispositivo.setTipo(request.getTipo());
        dispositivo.setUbicacion(request.getUbicacion());

        if (request.getEmpleadoAsignadoId() != null) {
            Empleado empleado = empleadoRepository.findById(request.getEmpleadoAsignadoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));
            dispositivo.setEmpleadoAsignado(empleado);
        } else {
            dispositivo.setEmpleadoAsignado(null);
        }

        // Actualizar PIN solo si se proporciona uno nuevo
        if (request.getPin() != null && !request.getPin().isEmpty()) {
            dispositivo.setPinRapido(passwordEncoder.encode(request.getPin()));
        }

        dispositivo.setCategoriasPredeterminadas(request.getCategoriasPredeterminadas());
        dispositivo.setConfigImpresora(request.getConfigImpresora());
        dispositivo.setTieneLectorBarras(request.getTieneLectorBarras());
        dispositivo.setTieneCajonDinero(request.getTieneCajonDinero());
        dispositivo.setTienePantallaCliente(request.getTienePantallaCliente());
        dispositivo.setPermisos(request.getPermisos());

        dispositivo = dispositivoPOSRepository.save(dispositivo);
        log.info("✅ Dispositivo POS actualizado: {}", dispositivo.getNombre());

        return mapToDTO(dispositivo);
    }

    @Transactional
    public void eliminar(Long id) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        // Verificar si tiene ventas pendientes
        Long ventasPendientes = ventaPendienteSyncRepository.countPendientesPorDispositivo(id);
        if (ventasPendientes > 0) {
            throw new IllegalStateException(
                    "No se puede eliminar el dispositivo. Tiene " + ventasPendientes + " ventas pendientes de sincronización");
        }

        dispositivoPOSRepository.delete(dispositivo);
        log.info("🗑️ Dispositivo POS eliminado: {}", dispositivo.getNombre());
    }

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    @Transactional
    public AuthDispositivoDTO autenticarConPIN(String uuid, String pin) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findByUuid(uuid)
                .orElseThrow(() -> new UnauthorizedException("Dispositivo no encontrado"));

        if (!dispositivo.getActivo()) {
            registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.LOGIN_FALLIDO, "Dispositivo desactivado", null);
            throw new UnauthorizedException("Dispositivo desactivado");
        }

        if (!passwordEncoder.matches(pin, dispositivo.getPinRapido())) {
            registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.LOGIN_FALLIDO, "PIN incorrecto", null);
            throw new UnauthorizedException("PIN incorrecto");
        }

        // Actualizar última conexión
        dispositivo.setUltimaConexion(LocalDateTime.now());
        dispositivoPOSRepository.save(dispositivo);

        // Registrar log exitoso
        registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.LOGIN, "Autenticación exitosa", null);

        // Generar token JWT
        String token = jwtTokenProvider.generateToken(dispositivo.getUuid());

        log.info("✅ Dispositivo autenticado: {} ({})", dispositivo.getNombre(), dispositivo.getUuid());

        return AuthDispositivoDTO.builder()
                .token(token)
                .type("Bearer")
                .dispositivo(mapToDTO(dispositivo))
                .configuracion(obtenerConfiguracion(dispositivo.getId()))
                .build();
    }

    @Transactional(readOnly = true)
    public ConfiguracionPOSDTO obtenerConfiguracion(Long dispositivoId) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        // Obtener productos para precarga (solo activos)
        List<ProductoDTO> productos = productoRepository.findByActivoTrue().stream()
                .map(this::mapProductoToDTO)
                .collect(Collectors.toList());

        // Buscar sesión de caja activa
        Long sesionActiva = null;
        var sesiones = sesionVentaRepository.findByActivaTrue();
        if (!sesiones.isEmpty()) {
            sesionActiva = sesiones.get(0).getId();
        }

        return ConfiguracionPOSDTO.builder()
                .dispositivoId(dispositivo.getId())
                .categoriasPredeterminadas(dispositivo.getCategoriasPredeterminadas())
                .permisos(dispositivo.getPermisos())
                .configImpresora(dispositivo.getConfigImpresora())
                .tieneLectorBarras(dispositivo.getTieneLectorBarras())
                .tieneCajonDinero(dispositivo.getTieneCajonDinero())
                .tienePantallaCliente(dispositivo.getTienePantallaCliente())
                .modoOfflineHabilitado(dispositivo.getModoOfflineHabilitado())
                .productosPrecargados(productos)
                .sesionCajaActiva(sesionActiva)
                .build();
    }

    @Transactional
    public void registrarHeartbeat(Long dispositivoId) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        dispositivo.setUltimaConexion(LocalDateTime.now());
        dispositivoPOSRepository.save(dispositivo);
    }

    // ============================================
    // SINCRONIZACIÓN OFFLINE
    // ============================================

    @Transactional
    public List<ResultadoSincronizacionDTO> sincronizarVentasOffline(
            List<VentaOfflineDTO> ventas, Long dispositivoId) {

        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        List<ResultadoSincronizacionDTO> resultados = ventas.stream()
                .map(venta -> sincronizarVentaIndividual(venta, dispositivo))
                .collect(Collectors.toList());

        // Actualizar última sincronización
        dispositivo.setUltimaSincronizacion(LocalDateTime.now());
        dispositivoPOSRepository.save(dispositivo);

        long exitosas = resultados.stream().filter(ResultadoSincronizacionDTO::getExitoso).count();
        log.info("✅ Sincronizadas {}/{} ventas del dispositivo: {}",
                exitosas, resultados.size(), dispositivo.getNombre());

        return resultados;
    }

    private ResultadoSincronizacionDTO sincronizarVentaIndividual(
            VentaOfflineDTO ventaOffline, DispositivoPOS dispositivo) {

        try {
            // Verificar si ya fue sincronizada
            if (ventaPendienteSyncRepository.existsByUuidVentaAndSincronizadaTrue(ventaOffline.getUuidVenta())) {
                log.warn("⚠️ Venta {} ya sincronizada, omitiendo", ventaOffline.getUuidVenta());
                return ResultadoSincronizacionDTO.duplicado(ventaOffline.getUuidVenta());
            }

            // Aquí iría la lógica para crear la venta en el sistema
            // Por ahora, guardamos como pendiente exitosa
            VentaPendienteSync pendiente = VentaPendienteSync.builder()
                    .dispositivo(dispositivo)
                    .uuidVenta(ventaOffline.getUuidVenta())
                    .datosVenta(ventaOffline.getDatosVenta())
                    .sincronizada(true)
                    .fechaSincronizacion(LocalDateTime.now())
                    .build();

            ventaPendienteSyncRepository.save(pendiente);

            registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.SINCRONIZACION,
                    "Venta sincronizada: " + ventaOffline.getUuidVenta(), null);

            return ResultadoSincronizacionDTO.exitoso(ventaOffline.getUuidVenta(), null);

        } catch (Exception e) {
            log.error("❌ Error sincronizando venta {}: {}", ventaOffline.getUuidVenta(), e.getMessage());

            // Guardar para retry
            VentaPendienteSync pendiente = VentaPendienteSync.builder()
                    .dispositivo(dispositivo)
                    .uuidVenta(ventaOffline.getUuidVenta())
                    .datosVenta(ventaOffline.getDatosVenta())
                    .sincronizada(false)
                    .intentosSincronizacion(1)
                    .ultimoIntento(LocalDateTime.now())
                    .proximoIntento(LocalDateTime.now().plusMinutes(5))
                    .errorSincronizacion(e.getMessage())
                    .build();

            ventaPendienteSyncRepository.save(pendiente);

            return ResultadoSincronizacionDTO.error(ventaOffline.getUuidVenta(), e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<VentaOfflineDTO> obtenerVentasPendientes(Long dispositivoId) {
        return ventaPendienteSyncRepository.findByDispositivoIdAndSincronizadaFalse(dispositivoId).stream()
                .map(v -> VentaOfflineDTO.builder()
                        .uuidVenta(v.getUuidVenta())
                        .datosVenta(v.getDatosVenta())
                        .sesionCajaId(v.getSesionCaja() != null ? v.getSesionCaja().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }

    // ============================================
    // LOGS Y AUDITORÍA
    // ============================================

    @Transactional(readOnly = true)
    public List<DispositivoLogDTO> obtenerLogs(Long dispositivoId, int limit) {
        return logRepository.findTopNByDispositivoId(dispositivoId, limit).stream()
                .map(this::mapLogToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void registrarLog(Long dispositivoId, String tipoEvento, String descripcion, Map<String, Object> metadata) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        registrarLogInterno(dispositivo,
                DispositivoPOSLog.TipoEvento.valueOf(tipoEvento),
                descripcion,
                metadata);
    }

    private void registrarLogInterno(DispositivoPOS dispositivo,
                                      DispositivoPOSLog.TipoEvento tipoEvento,
                                      String descripcion,
                                      Map<String, Object> metadata) {
        DispositivoPOSLog log = DispositivoPOSLog.builder()
                .dispositivo(dispositivo)
                .tipoEvento(tipoEvento)
                .descripcion(descripcion)
                .metadata(metadata)
                .empleado(dispositivo.getEmpleadoAsignado())
                .ipAddress(dispositivo.getIpAddress())
                .build();

        logRepository.save(log);
    }

    // ============================================
    // MAPPERS
    // ============================================

    private DispositivoPOSDTO mapToDTO(DispositivoPOS dispositivo) {
        return DispositivoPOSDTO.builder()
                .id(dispositivo.getId())
                .uuid(dispositivo.getUuid())
                .nombre(dispositivo.getNombre())
                .descripcion(dispositivo.getDescripcion())
                .tipo(dispositivo.getTipo())
                .ubicacion(dispositivo.getUbicacion())
                .empleadoAsignadoId(dispositivo.getEmpleadoAsignado() != null ?
                        dispositivo.getEmpleadoAsignado().getId() : null)
                .empleadoAsignadoNombre(dispositivo.getEmpleadoAsignado() != null ?
                        dispositivo.getEmpleadoAsignado().getNombre() : null)
                .categoriasPredeterminadas(dispositivo.getCategoriasPredeterminadas())
                .configImpresora(dispositivo.getConfigImpresora())
                .tieneLectorBarras(dispositivo.getTieneLectorBarras())
                .tieneCajonDinero(dispositivo.getTieneCajonDinero())
                .tienePantallaCliente(dispositivo.getTienePantallaCliente())
                .permisos(dispositivo.getPermisos())
                .activo(dispositivo.getActivo())
                .modoOfflineHabilitado(dispositivo.getModoOfflineHabilitado())
                .ultimaConexion(dispositivo.getUltimaConexion())
                .ultimaSincronizacion(dispositivo.getUltimaSincronizacion())
                .ipAddress(dispositivo.getIpAddress())
                .createdAt(dispositivo.getCreatedAt())
                .updatedAt(dispositivo.getUpdatedAt())
                .build();
    }

    private DispositivoLogDTO mapLogToDTO(DispositivoPOSLog log) {
        return DispositivoLogDTO.builder()
                .id(log.getId())
                .dispositivoId(log.getDispositivo().getId())
                .tipoEvento(log.getTipoEvento())
                .descripcion(log.getDescripcion())
                .metadata(log.getMetadata())
                .empleadoId(log.getEmpleado() != null ? log.getEmpleado().getId() : null)
                .empleadoNombre(log.getEmpleado() != null ? log.getEmpleado().getNombre() : null)
                .ipAddress(log.getIpAddress())
                .fecha(log.getFecha())
                .build();
    }

    private ProductoDTO mapProductoToDTO(Producto producto) {
        // Mapping simplificado - ajustar según tu ProductoDTO actual
        ProductoDTO dto = new ProductoDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setPrecio(producto.getPrecio());
        dto.setCategoria(producto.getCategoria() != null ? producto.getCategoria().getNombre() : null);
        dto.setStock(producto.getStock());
        dto.setActivo(producto.getActivo());
        return dto;
    }
}
