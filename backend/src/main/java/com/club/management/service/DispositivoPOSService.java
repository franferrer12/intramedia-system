package com.club.management.service;

import com.club.management.dto.*;
import com.club.management.dto.response.ProductoDTO;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Base64;

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
    private final SesionCajaRepository sesionCajaRepository;
    private final VentaRepository ventaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // ============================================
    // GESTIÓN DE DISPOSITIVOS
    // ============================================

    @Transactional
    public DispositivoPOSDTO registrar(DispositivoPOSRequest request) {
        // Validar que el PIN sea obligatorio en la creación
        if (request.getPin() == null || request.getPin().trim().isEmpty()) {
            throw new IllegalArgumentException("El PIN es obligatorio al crear un dispositivo");
        }

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

            // Si es asignación permanente, verificar que el empleado no esté asignado a otro dispositivo
            if (Boolean.TRUE.equals(request.getAsignacionPermanente())) {
                Optional<DispositivoPOS> otroDispositivo = dispositivoPOSRepository
                        .findByEmpleadoAsignadoAndAsignacionPermanente(empleado, true);

                if (otroDispositivo.isPresent()) {
                    throw new IllegalArgumentException(
                        "El empleado ya está asignado permanentemente al dispositivo: " +
                        otroDispositivo.get().getNombre());
                }
            }
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
                .modoTabletCompartida(request.getModoTabletCompartida())
                .asignacionPermanente(request.getAsignacionPermanente())
                .build();

        dispositivo = dispositivoPOSRepository.save(dispositivo);
        log.info("✅ Dispositivo POS registrado: {} (UUID: {}, Asignación: {})",
                dispositivo.getNombre(),
                dispositivo.getUuid(),
                Boolean.TRUE.equals(dispositivo.getAsignacionPermanente()) ? "Permanente" : "Temporal");

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

        // Validación de asignación de empleado
        if (request.getEmpleadoAsignadoId() != null) {
            Empleado empleado = empleadoRepository.findById(request.getEmpleadoAsignadoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));

            // Si es asignación permanente, verificar que el empleado no esté asignado a otro dispositivo
            if (Boolean.TRUE.equals(request.getAsignacionPermanente())) {
                Optional<DispositivoPOS> otroDispositivo = dispositivoPOSRepository
                        .findByEmpleadoAsignadoAndAsignacionPermanenteAndIdNot(
                                empleado, true, id);

                if (otroDispositivo.isPresent()) {
                    throw new IllegalArgumentException(
                        "El empleado ya está asignado permanentemente al dispositivo: " +
                        otroDispositivo.get().getNombre());
                }
            }

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
        dispositivo.setModoTabletCompartida(request.getModoTabletCompartida());
        dispositivo.setAsignacionPermanente(request.getAsignacionPermanente());
        dispositivo.setPermisos(request.getPermisos());

        dispositivo = dispositivoPOSRepository.save(dispositivo);
        log.info("✅ Dispositivo POS actualizado: {} (Asignación: {})",
                dispositivo.getNombre(),
                Boolean.TRUE.equals(dispositivo.getAsignacionPermanente()) ? "Permanente" : "Temporal");

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
    // AUTENTICACIÓN Y PAIRING
    // ============================================

    /**
     * NUEVO: Genera un token de emparejamiento temporal (expira en 1 hora).
     * El admin puede compartir este token via QR, enlace directo o código manual.
     * El dispositivo usa este token para vincularse sin necesidad de UUID/PIN.
     */
    @Transactional
    public com.club.management.dto.response.PairingTokenDTO generarTokenPairing(Long dispositivoId) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        // Generar código corto aleatorio (6 dígitos)
        String pairingCode = generarCodigoPairing();

        // Generar token único (UUID) - NO es un JWT, es un identificador temporal
        String token = UUID.randomUUID().toString();

        // Expira en 1 hora
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

        // Guardar en DB
        dispositivo.setPairingToken(token);
        dispositivo.setPairingTokenExpiresAt(expiresAt);
        dispositivo.setPairingCode(pairingCode);
        dispositivoPOSRepository.save(dispositivo);

        // URL base del frontend (debería venir de configuración)
        String frontendUrl = "https://club-management-frontend-b893.onrender.com";
        // El frontend leerá el parámetro 'p' desde la URL
        String directLink = frontendUrl + "/pos-terminal/pair?p=" + token;

        log.info("🔗 Token de pairing generado para dispositivo: {} (código: {}, expira: {})",
                dispositivo.getNombre(), pairingCode, expiresAt);

        return com.club.management.dto.response.PairingTokenDTO.builder()
                .token(token)
                .pairingCode(pairingCode)
                .expiresAt(expiresAt)
                .qrCodeData(directLink) // El QR contendrá el enlace completo
                .directLink(directLink)
                .validityMinutes(60)
                .build();
    }

    /**
     * NUEVO: Vincula un dispositivo usando el token de pairing generado.
     * Este es un endpoint público (sin autenticación) que usa GET con query param.
     */
    @Transactional
    public com.club.management.dto.response.DeviceAuthDTO vincularPorToken(String token) {
        // Buscar dispositivo por token
        DispositivoPOS dispositivo = dispositivoPOSRepository.findByPairingToken(token)
                .orElseThrow(() -> new UnauthorizedException("Token de pairing inválido o expirado"));

        // Verificar expiración
        if (dispositivo.getPairingTokenExpiresAt() == null ||
            LocalDateTime.now().isAfter(dispositivo.getPairingTokenExpiresAt())) {
            throw new UnauthorizedException("Token de pairing expirado");
        }

        // Verificar que esté activo
        if (!dispositivo.getActivo()) {
            throw new UnauthorizedException("Dispositivo desactivado");
        }

        // Generar token de dispositivo de larga duración (30 días)
        String deviceToken = jwtTokenProvider.generateTokenFromUsername("device:" + dispositivo.getUuid());

        // Actualizar última conexión
        dispositivo.setUltimaConexion(LocalDateTime.now());

        // Invalidar pairing token (solo se puede usar una vez)
        dispositivo.setPairingToken(null);
        dispositivo.setPairingTokenExpiresAt(null);
        dispositivo.setPairingCode(null);
        dispositivoPOSRepository.save(dispositivo);

        // Registrar log
        registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.LOGIN,
                "Vinculación exitosa via pairing token", null);

        log.info("✅ Dispositivo vinculado via pairing token: {} (UUID: {})",
                dispositivo.getNombre(), dispositivo.getUuid());

        return buildDeviceAuthDTO(dispositivo, deviceToken);
    }

    /**
     * NUEVO: Vincula un dispositivo usando el código corto de pairing (6 dígitos).
     */
    @Transactional
    public com.club.management.dto.response.DeviceAuthDTO vincularPorCodigo(String pairingCode) {
        // Buscar dispositivo por código
        DispositivoPOS dispositivo = dispositivoPOSRepository.findByPairingCode(pairingCode)
                .orElseThrow(() -> new UnauthorizedException("Código de pairing inválido o expirado"));

        // Verificar expiración
        if (dispositivo.getPairingTokenExpiresAt() == null ||
            LocalDateTime.now().isAfter(dispositivo.getPairingTokenExpiresAt())) {
            throw new UnauthorizedException("Código de pairing expirado");
        }

        // Verificar que esté activo
        if (!dispositivo.getActivo()) {
            throw new UnauthorizedException("Dispositivo desactivado");
        }

        // Generar token de dispositivo de larga duración (30 días)
        String deviceToken = jwtTokenProvider.generateTokenFromUsername("device:" + dispositivo.getUuid());

        // Actualizar última conexión
        dispositivo.setUltimaConexion(LocalDateTime.now());

        // Invalidar pairing code (solo se puede usar una vez)
        dispositivo.setPairingToken(null);
        dispositivo.setPairingTokenExpiresAt(null);
        dispositivo.setPairingCode(null);
        dispositivoPOSRepository.save(dispositivo);

        // Registrar log
        registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.LOGIN,
                "Vinculación exitosa via código de pairing: " + pairingCode, null);

        log.info("✅ Dispositivo vinculado via código: {} (UUID: {})",
                dispositivo.getNombre(), dispositivo.getUuid());

        return buildDeviceAuthDTO(dispositivo, deviceToken);
    }

    private com.club.management.dto.response.DeviceAuthDTO buildDeviceAuthDTO(DispositivoPOS dispositivo, String deviceToken) {
        return com.club.management.dto.response.DeviceAuthDTO.builder()
                .success(true)
                .deviceUUID(dispositivo.getUuid())
                .deviceToken(deviceToken)
                .device(com.club.management.dto.response.DeviceAuthDTO.DeviceInfoDTO.builder()
                        .id(dispositivo.getId())
                        .uuid(dispositivo.getUuid())
                        .nombre(dispositivo.getNombre())
                        .tipo(dispositivo.getTipo() != null ? dispositivo.getTipo().name() : null)
                        .ubicacion(dispositivo.getUbicacion())
                        .empleadoAsignadoId(dispositivo.getEmpleadoAsignado() != null ?
                                dispositivo.getEmpleadoAsignado().getId() : null)
                        .empleadoAsignadoNombre(dispositivo.getEmpleadoAsignado() != null ?
                                dispositivo.getEmpleadoAsignado().getNombre() + " " + dispositivo.getEmpleadoAsignado().getApellidos() : null)
                        .asignacionPermanente(dispositivo.getAsignacionPermanente())
                        .modoTabletCompartida(dispositivo.getModoTabletCompartida())
                        .config(com.club.management.dto.response.DeviceAuthDTO.DeviceConfigDTO.builder()
                                .categoriasPredeterminadas(dispositivo.getCategoriasPredeterminadas())
                                .tieneLectorBarras(dispositivo.getTieneLectorBarras())
                                .tieneCajonDinero(dispositivo.getTieneCajonDinero())
                                .tienePantallaCliente(dispositivo.getTienePantallaCliente())
                                .permisos(dispositivo.getPermisos())
                                .build())
                        .build())
                .build();
    }

    private String generarCodigoPairing() {
        // Generar código de 6 dígitos con formato: 123-456
        Random random = new Random();
        int parte1 = 100 + random.nextInt(900); // 100-999
        int parte2 = 100 + random.nextInt(900); // 100-999
        return String.format("%03d-%03d", parte1, parte2);
    }

    /**
     * ANTIGUO: Mantener para backward compatibility.
     * Genera un token de emparejamiento para simplificar la vinculación inicial del dispositivo.
     * El token puede usarse para:
     * - Generar un código QR que el dispositivo escanea
     * - Crear un enlace que se abre en el dispositivo
     * El token contiene: UUID del dispositivo y PIN cifrado
     */
    @Transactional
    @Deprecated
    public PairingTokenDTO generarTokenEmparejamiento(Long dispositivoId) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        // Generar token que contiene uuid y pin (válido por 24 horas)
        LocalDateTime expiracion = LocalDateTime.now().plusHours(24);
        String pairingData = dispositivo.getUuid() + ":" + expiracion.toString();
        String pairingToken = Base64.getEncoder().encodeToString(pairingData.getBytes());

        // URL de pairing que puede abrirse en el navegador del dispositivo
        // El frontend procesará esto y llamará a /autenticar-con-token
        String pairingUrl = "/pos/pair?token=" + pairingToken;

        log.info("📱 Token de emparejamiento generado para: {} (válido hasta: {})",
                dispositivo.getNombre(), expiracion);

        return PairingTokenDTO.builder()
                .pairingToken(pairingToken)
                .pairingUrl(pairingUrl)
                .qrCodeData(pairingUrl) // El QR contendrá la URL completa
                .dispositivoId(dispositivo.getId())
                .dispositivoNombre(dispositivo.getNombre())
                .expiresAt(expiracion)
                .build();
    }

    /**
     * Autentica un dispositivo usando un token de emparejamiento.
     * Permite al dispositivo conectarse sin tener que ingresar manualmente UUID y PIN.
     */
    @Transactional
    public AuthDispositivoDTO autenticarConToken(String pairingToken) {
        try {
            // Decodificar token
            String decoded = new String(Base64.getDecoder().decode(pairingToken));
            String[] parts = decoded.split(":");
            if (parts.length != 2) {
                throw new UnauthorizedException("Token de emparejamiento inválido");
            }

            String uuid = parts[0];
            LocalDateTime expiracion = LocalDateTime.parse(parts[1]);

            // Verificar expiración
            if (LocalDateTime.now().isAfter(expiracion)) {
                throw new UnauthorizedException("Token de emparejamiento expirado");
            }

            // Buscar dispositivo
            DispositivoPOS dispositivo = dispositivoPOSRepository.findByUuid(uuid)
                    .orElseThrow(() -> new UnauthorizedException("Dispositivo no encontrado"));

            if (!dispositivo.getActivo()) {
                throw new UnauthorizedException("Dispositivo desactivado");
            }

            // Actualizar última conexión
            dispositivo.setUltimaConexion(LocalDateTime.now());
            dispositivoPOSRepository.save(dispositivo);

            // Registrar log exitoso
            registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.LOGIN,
                    "Autenticación con token de emparejamiento", null);

            // Generar token JWT
            String jwtToken = jwtTokenProvider.generateTokenFromUsername(dispositivo.getUuid());

            log.info("✅ Dispositivo emparejado y autenticado: {} ({})",
                    dispositivo.getNombre(), dispositivo.getUuid());

            return AuthDispositivoDTO.builder()
                    .token(jwtToken)
                    .type("Bearer")
                    .dispositivo(mapToDTO(dispositivo))
                    .configuracion(obtenerConfiguracion(dispositivo.getId()))
                    .build();

        } catch (IllegalArgumentException e) {
            throw new UnauthorizedException("Token de emparejamiento inválido");
        }
    }

    /**
     * Autentica un dispositivo usando email o DNI de empleado.
     * Permite al POS terminal autenticarse directamente con el identificador del empleado,
     * sin necesidad de conocer el UUID del dispositivo.
     * Solo funciona con dispositivos en modo Quick Start (asignación temporal).
     *
     * @param identifier Email o DNI del empleado
     * @return Autenticación del dispositivo con token JWT
     */
    @Transactional
    public AuthDispositivoDTO autenticarConIdentificadorEmpleado(String identifier) {

        // Buscar empleado por email o DNI
        Empleado empleado = empleadoRepository.findByEmail(identifier)
                .or(() -> empleadoRepository.findByDni(identifier))
                .orElseThrow(() -> new UnauthorizedException("Empleado no encontrado"));

        if (!empleado.getActivo()) {
            throw new UnauthorizedException("Empleado inactivo");
        }

        // Buscar un dispositivo disponible (sin asignación permanente y sin empleado asignado)
        List<DispositivoPOS> dispositivosDisponibles = dispositivoPOSRepository
                .findByActivoTrueAndAsignacionPermanenteFalseAndEmpleadoAsignadoNull();

        if (dispositivosDisponibles.isEmpty()) {
            throw new UnauthorizedException("No hay dispositivos disponibles para Quick Start");
        }

        // Seleccionar el primer dispositivo disponible
        DispositivoPOS dispositivo = dispositivosDisponibles.get(0);

        // Vincular temporalmente el empleado al dispositivo
        dispositivo.setEmpleadoAsignado(empleado);
        dispositivo.setUltimaConexion(LocalDateTime.now());
        dispositivo = dispositivoPOSRepository.save(dispositivo);

        // Registrar log exitoso
        registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.LOGIN,
                "Login Quick Start con identificador: " + empleado.getNombre(), null);

        // Generar token JWT para el dispositivo
        String jwtToken = jwtTokenProvider.generateTokenFromUsername(dispositivo.getUuid());

        log.info("✅ Empleado {} autenticado en dispositivo {} via Quick Start",
                empleado.getNombre(), dispositivo.getNombre());

        return AuthDispositivoDTO.builder()
                .token(jwtToken)
                .type("Bearer")
                .dispositivo(mapToDTO(dispositivo))
                .configuracion(obtenerConfiguracion(dispositivo.getId()))
                .build();
    }

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
        String token = jwtTokenProvider.generateTokenFromUsername(dispositivo.getUuid());

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

        // Obtener empleados activos si está en modo tablet compartida O no tiene empleado asignado
        List<EmpleadoSimpleDTO> empleadosActivos = null;
        if (Boolean.TRUE.equals(dispositivo.getModoTabletCompartida()) || dispositivo.getEmpleadoAsignado() == null) {
            empleadosActivos = empleadoRepository.findByActivoTrue().stream()
                    .map(this::mapEmpleadoSimpleToDTO)
                    .collect(Collectors.toList());
            log.info("📋 Cargando {} empleados activos para selector (modoTabletCompartida={}, sinEmpleado={})",
                    empleadosActivos.size(),
                    Boolean.TRUE.equals(dispositivo.getModoTabletCompartida()),
                    dispositivo.getEmpleadoAsignado() == null);
        }

        // Buscar sesión de caja activa
        Long sesionActiva = null;
        var sesiones = sesionVentaRepository.findByEstadoOrderByFechaAperturaDesc(SesionVenta.EstadoSesion.ABIERTA);
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
                .modoTabletCompartida(dispositivo.getModoTabletCompartida())
                .productosPrecargados(productos)
                .empleadosActivos(empleadosActivos)
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
    // VINCULACIÓN TEMPORAL (QUICK START)
    // ============================================

    @Transactional
    public DispositivoPOSDTO vincularTemporalmente(Long dispositivoId, Long empleadoId) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        // Verificar que el dispositivo NO tenga asignación permanente
        if (Boolean.TRUE.equals(dispositivo.getAsignacionPermanente())) {
            throw new IllegalStateException(
                "Este dispositivo tiene asignación permanente. No se puede usar Quick Start. " +
                "Usa el dispositivo asignado o cambia el modo a temporal.");
        }

        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));

        // Desvincular empleado de cualquier otro dispositivo temporal
        dispositivoPOSRepository.findByEmpleadoAsignado(empleadoId).forEach(d -> {
            if (Boolean.FALSE.equals(d.getAsignacionPermanente())) {
                d.setEmpleadoAsignado(null);
                dispositivoPOSRepository.save(d);
                log.info("🔄 Empleado desvinculado automáticamente de: {}", d.getNombre());
            }
        });

        // Vincular temporalmente
        dispositivo.setEmpleadoAsignado(empleado);
        dispositivo = dispositivoPOSRepository.save(dispositivo);

        registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.ACTUALIZACION,
                "Vinculación temporal: " + empleado.getNombre(), null);

        log.info("✅ Quick Start: {} vinculado temporalmente a {}",
                empleado.getNombre(), dispositivo.getNombre());

        return mapToDTO(dispositivo);
    }

    @Transactional
    public DispositivoPOSDTO desvincular(Long dispositivoId) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        // Solo desvincular si NO tiene asignación permanente
        if (Boolean.TRUE.equals(dispositivo.getAsignacionPermanente())) {
            throw new IllegalStateException(
                "Este dispositivo tiene asignación permanente. No se puede desvincular automáticamente.");
        }

        String empleadoNombre = dispositivo.getEmpleadoAsignado() != null ?
                dispositivo.getEmpleadoAsignado().getNombre() : "ninguno";

        dispositivo.setEmpleadoAsignado(null);
        dispositivo = dispositivoPOSRepository.save(dispositivo);

        registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.ACTUALIZACION,
                "Desvinculación: " + empleadoNombre, null);

        log.info("🔓 Dispositivo desvinculado: {} (empleado: {})",
                dispositivo.getNombre(), empleadoNombre);

        return mapToDTO(dispositivo);
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

            // Extraer datos de la venta offline
            Map<String, Object> datosVenta = ventaOffline.getDatosVenta();

            // Obtener sesión de caja activa o usar la especificada
            SesionCaja sesionCaja;
            if (ventaOffline.getSesionCajaId() != null) {
                sesionCaja = sesionCajaRepository.findById(ventaOffline.getSesionCajaId())
                        .orElseThrow(() -> new RuntimeException("Sesión de caja no encontrada: " + ventaOffline.getSesionCajaId()));
            } else {
                // Buscar sesión activa
                List<SesionCaja> sesionesActivas = sesionCajaRepository.findAllSesionesAbiertas();
                if (sesionesActivas.isEmpty()) {
                    throw new RuntimeException("No hay sesión de caja activa para sincronizar venta offline");
                }
                sesionCaja = sesionesActivas.get(0);
            }

            // Validar que la sesión esté abierta
            if (sesionCaja.getEstado() != SesionCaja.EstadoSesionCaja.ABIERTA) {
                throw new RuntimeException("La sesión de caja no está abierta");
            }

            // Obtener empleado: primero intentar desde datosVenta, sino desde el dispositivo
            Empleado empleado = null;

            // 1. Intentar obtener empleadoId desde datosVenta (tiene prioridad)
            if (datosVenta.containsKey("empleadoId") && datosVenta.get("empleadoId") != null) {
                Number empleadoIdNum = (Number) datosVenta.get("empleadoId");
                Long empleadoId = empleadoIdNum.longValue();
                empleado = empleadoRepository.findById(empleadoId)
                        .orElseThrow(() -> new RuntimeException("Empleado no encontrado: " + empleadoId));
                log.info("👤 Empleado obtenido desde datos de venta: {} (ID: {})", empleado.getNombre(), empleado.getId());
            }
            // 2. Si no hay empleadoId en datosVenta, usar empleado asignado al dispositivo
            else if (dispositivo.getEmpleadoAsignado() != null) {
                empleado = dispositivo.getEmpleadoAsignado();
                log.info("👤 Empleado obtenido desde dispositivo: {} (ID: {})", empleado.getNombre(), empleado.getId());
            }
            // 3. Si no hay ni empleadoId ni empleado asignado, error
            else {
                throw new RuntimeException("No se pudo determinar el empleado: ni en datosVenta ni en dispositivo");
            }

            // Parsear método de pago
            String metodoPagoStr = (String) datosVenta.get("metodoPago");
            Venta.MetodoPago metodoPago = Venta.MetodoPago.valueOf(metodoPagoStr);

            // Obtener total
            Number totalNumber = (Number) datosVenta.get("total");
            BigDecimal total = BigDecimal.valueOf(totalNumber.doubleValue());

            // ⚠️ CRÍTICO: Obtener montos específicos enviados por el frontend
            // El frontend ya envía los montos exactos de efectivo y tarjeta
            BigDecimal montoEfectivo = BigDecimal.ZERO;
            BigDecimal montoTarjeta = BigDecimal.ZERO;

            if (datosVenta.containsKey("montoEfectivo") && datosVenta.get("montoEfectivo") != null) {
                Number montoEfectivoNum = (Number) datosVenta.get("montoEfectivo");
                montoEfectivo = BigDecimal.valueOf(montoEfectivoNum.doubleValue());
            }

            if (datosVenta.containsKey("montoTarjeta") && datosVenta.get("montoTarjeta") != null) {
                Number montoTarjetaNum = (Number) datosVenta.get("montoTarjeta");
                montoTarjeta = BigDecimal.valueOf(montoTarjetaNum.doubleValue());
            }

            // Si el frontend NO envió los montos (ventas antiguas), calcular según metodoPago
            if (montoEfectivo.compareTo(BigDecimal.ZERO) == 0 && montoTarjeta.compareTo(BigDecimal.ZERO) == 0) {
                log.warn("⚠️ Venta sin montos específicos, calculando según método de pago: {}", metodoPago);

                switch (metodoPago) {
                    case EFECTIVO:
                        montoEfectivo = total;
                        break;
                    case TARJETA:
                        montoTarjeta = total;
                        break;
                    case MIXTO:
                        // Fallback: split 50/50 si no se especifica
                        BigDecimal mitad = total.divide(BigDecimal.valueOf(2), 2, BigDecimal.ROUND_HALF_UP);
                        montoEfectivo = mitad;
                        montoTarjeta = mitad;
                        break;
                }
            }

            // Extraer fecha de la venta offline (si existe), sino usar fecha actual
            LocalDateTime fechaVenta = LocalDateTime.now();
            if (datosVenta.containsKey("fechaVenta") && datosVenta.get("fechaVenta") != null) {
                try {
                    // El frontend envía la fecha como ISO string
                    String fechaStr = (String) datosVenta.get("fechaVenta");
                    fechaVenta = LocalDateTime.parse(fechaStr);
                    log.info("📅 Usando fecha original de la venta offline: {}", fechaVenta);
                } catch (Exception e) {
                    log.warn("⚠️ Error parseando fecha, usando fecha actual: {}", e.getMessage());
                    fechaVenta = LocalDateTime.now();
                }
            } else {
                log.info("📅 Fecha no encontrada en datosVenta, usando fecha actual del servidor");
            }

            // Crear venta con los montos correctos y fecha original
            Venta venta = Venta.builder()
                    .sesionCaja(sesionCaja)
                    .empleado(empleado)
                    .metodoPago(metodoPago)
                    .subtotal(BigDecimal.ZERO)
                    .descuento(BigDecimal.ZERO)
                    .total(BigDecimal.ZERO)
                    .montoEfectivo(montoEfectivo)
                    .montoTarjeta(montoTarjeta)
                    .fecha(fechaVenta)  // ⭐ IMPORTANTE: Usar fecha original del POS
                    .detalles(new ArrayList<>())
                    .build();

            log.info("💰 Procesando venta offline: Total={}, Efectivo={}, Tarjeta={}, Método={}",
                    total, montoEfectivo, montoTarjeta, metodoPago);

            // Procesar items
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) datosVenta.get("items");

            for (Map<String, Object> itemData : items) {
                Number productoIdNum = (Number) itemData.get("productoId");
                Long productoId = productoIdNum.longValue();

                Number cantidadNum = (Number) itemData.get("cantidad");
                Integer cantidad = cantidadNum.intValue();

                Number precioNum = (Number) itemData.get("precioUnitario");
                BigDecimal precioUnitario = BigDecimal.valueOf(precioNum.doubleValue());

                // Obtener producto
                Producto producto = productoRepository.findById(productoId)
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));

                // Crear detalle
                DetalleVenta detalle = DetalleVenta.builder()
                        .producto(producto)
                        .cantidad(cantidad)
                        .precioUnitario(precioUnitario)
                        .descuento(BigDecimal.ZERO)
                        .build();

                detalle.calcularTotales();
                venta.addDetalle(detalle);
            }

            // Recalcular totales de la venta
            venta.recalcularTotales();

            // Guardar venta (dispara triggers para transacciones y stock)
            Venta ventaGuardada = ventaRepository.save(venta);

            // Buscar o crear registro de sincronización
            VentaPendienteSync pendiente = ventaPendienteSyncRepository
                    .findByUuidVenta(ventaOffline.getUuidVenta())
                    .orElse(VentaPendienteSync.builder()
                            .dispositivo(dispositivo)
                            .uuidVenta(ventaOffline.getUuidVenta())
                            .build());

            // Actualizar datos
            pendiente.setDatosVenta(ventaOffline.getDatosVenta());
            pendiente.setVentaId(ventaGuardada.getId());
            pendiente.setSincronizada(true);
            pendiente.setFechaSincronizacion(LocalDateTime.now());
            pendiente.setErrorSincronizacion(null);

            ventaPendienteSyncRepository.save(pendiente);

            registrarLogInterno(dispositivo, DispositivoPOSLog.TipoEvento.SINCRONIZACION,
                    "Venta sincronizada: " + ventaOffline.getUuidVenta() + " -> Ticket: " + ventaGuardada.getNumeroTicket(),
                    null);

            log.info("✅ Venta offline sincronizada: UUID={}, Ticket={}, Total={}",
                    ventaOffline.getUuidVenta(), ventaGuardada.getNumeroTicket(), ventaGuardada.getTotal());

            return ResultadoSincronizacionDTO.exitoso(ventaOffline.getUuidVenta(), ventaGuardada.getId());

        } catch (Exception e) {
            log.error("❌ Error sincronizando venta {}: {}", ventaOffline.getUuidVenta(), e.getMessage(), e);

            // Buscar o crear registro para retry
            VentaPendienteSync pendiente = ventaPendienteSyncRepository
                    .findByUuidVenta(ventaOffline.getUuidVenta())
                    .orElse(VentaPendienteSync.builder()
                            .dispositivo(dispositivo)
                            .uuidVenta(ventaOffline.getUuidVenta())
                            .intentosSincronizacion(0)
                            .build());

            // Actualizar datos del error
            pendiente.setDatosVenta(ventaOffline.getDatosVenta());
            pendiente.setSincronizada(false);
            pendiente.setIntentosSincronizacion(pendiente.getIntentosSincronizacion() + 1);
            pendiente.setUltimoIntento(LocalDateTime.now());
            pendiente.setProximoIntento(LocalDateTime.now().plusMinutes(5));
            pendiente.setErrorSincronizacion(e.getMessage());

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
                .modoTabletCompartida(dispositivo.getModoTabletCompartida())
                .asignacionPermanente(dispositivo.getAsignacionPermanente())
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
        dto.setPrecioVenta(producto.getPrecioVenta());
        dto.setCategoria(producto.getCategoria());
        dto.setStockActual(producto.getStockActual());
        dto.setActivo(producto.getActivo());
        return dto;
    }

    private EmpleadoSimpleDTO mapEmpleadoSimpleToDTO(Empleado empleado) {
        String iniciales = (empleado.getNombre().substring(0, 1) + empleado.getApellidos().substring(0, 1)).toUpperCase();
        return EmpleadoSimpleDTO.builder()
                .id(empleado.getId())
                .nombre(empleado.getNombre())
                .apellido(empleado.getApellidos())
                .iniciales(iniciales)
                .puesto(empleado.getCargo())
                .activo(empleado.getActivo())
                .build();
    }
}
