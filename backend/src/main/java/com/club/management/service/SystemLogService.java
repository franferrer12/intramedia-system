package com.club.management.service;

import com.club.management.dto.SystemLogDTO;
import com.club.management.model.SystemLog;
import com.club.management.model.Usuario;
import com.club.management.repository.SystemLogRepository;
import com.club.management.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SystemLogService {

    private final SystemLogRepository systemLogRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    /**
     * Log an INFO level event
     */
    @Transactional
    public void logInfo(String modulo, String accion, String mensaje, Long usuarioId, String ipAddress, String userAgent) {
        SystemLog log = SystemLog.info(modulo, accion, mensaje);
        enrichLog(log, usuarioId, ipAddress, userAgent);
        systemLogRepository.save(log);
    }

    /**
     * Log a WARNING level event
     */
    @Transactional
    public void logWarning(String modulo, String accion, String mensaje, Long usuarioId, String ipAddress, String userAgent) {
        SystemLog log = SystemLog.warning(modulo, accion, mensaje);
        enrichLog(log, usuarioId, ipAddress, userAgent);
        systemLogRepository.save(log);
    }

    /**
     * Log an ERROR level event
     */
    @Transactional
    public void logError(String modulo, String accion, String mensaje, Exception exception, Long usuarioId, String ipAddress, String userAgent) {
        String stackTrace = exception != null ? getStackTraceAsString(exception) : null;
        SystemLog log = SystemLog.error(modulo, accion, mensaje, stackTrace);
        enrichLog(log, usuarioId, ipAddress, userAgent);
        systemLogRepository.save(log);
    }

    /**
     * Log a DEBUG level event
     */
    @Transactional
    public void logDebug(String modulo, String accion, String mensaje, Map<String, Object> detalles, Long usuarioId) {
        SystemLog log = SystemLog.debug(modulo, accion, mensaje);
        if (detalles != null && !detalles.isEmpty()) {
            log.setDetalles(objectMapper.valueToTree(detalles));
        }
        enrichLog(log, usuarioId, null, null);
        systemLogRepository.save(log);
    }

    /**
     * Get logs with filters
     */
    @Transactional(readOnly = true)
    public Page<SystemLogDTO> buscarLogs(
            SystemLog.Nivel nivel,
            String modulo,
            Long usuarioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SystemLog> logs = systemLogRepository.buscarConFiltros(
                nivel, modulo, usuarioId, fechaInicio, fechaFin, pageable
        );
        return logs.map(this::mapToDTO);
    }

    /**
     * Get recent logs for dashboard
     */
    @Transactional(readOnly = true)
    public List<SystemLogDTO> getRecentLogs(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return systemLogRepository.findRecent(pageable)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get statistics for dashboard
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getEstadisticas() {
        Map<String, Object> stats = new HashMap<>();

        LocalDateTime haceUnaHora = LocalDateTime.now().minusHours(1);
        LocalDateTime hace24Horas = LocalDateTime.now().minusHours(24);

        stats.put("totalLogs", systemLogRepository.count());
        stats.put("erroresUltimaHora", systemLogRepository.countErrorsSince(haceUnaHora));
        stats.put("erroresUltimas24Horas", systemLogRepository.countErrorsSince(hace24Horas));
        stats.put("totalErrores", systemLogRepository.countByNivel(SystemLog.Nivel.ERROR));
        stats.put("totalWarnings", systemLogRepository.countByNivel(SystemLog.Nivel.WARNING));
        stats.put("totalInfo", systemLogRepository.countByNivel(SystemLog.Nivel.INFO));
        stats.put("modulos", systemLogRepository.findDistinctModulos());

        return stats;
    }

    /**
     * Get all distinct modules
     */
    @Transactional(readOnly = true)
    public List<String> getModulos() {
        return systemLogRepository.findDistinctModulos();
    }

    /**
     * Delete logs older than specified date
     */
    @Transactional
    public void limpiarLogsAntiguos(LocalDateTime fecha) {
        systemLogRepository.deleteOlderThan(fecha);
    }

    // Helper methods

    private void enrichLog(SystemLog log, Long usuarioId, String ipAddress, String userAgent) {
        if (usuarioId != null) {
            usuarioRepository.findById(usuarioId).ifPresent(log::setUsuario);
        }
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
    }

    private String getStackTraceAsString(Exception exception) {
        StringBuilder sb = new StringBuilder();
        sb.append(exception.getClass().getName()).append(": ").append(exception.getMessage()).append("\n");
        for (StackTraceElement element : exception.getStackTrace()) {
            sb.append("\tat ").append(element.toString()).append("\n");
        }
        if (exception.getCause() != null) {
            sb.append("Caused by: ").append(getStackTraceAsString((Exception) exception.getCause()));
        }
        return sb.toString();
    }

    private SystemLogDTO mapToDTO(SystemLog log) {
        return SystemLogDTO.builder()
                .id(log.getId())
                .nivel(log.getNivel().name())
                .modulo(log.getModulo())
                .accion(log.getAccion())
                .mensaje(log.getMensaje())
                .detalles(log.getDetalles())
                .usuarioId(log.getUsuario() != null ? log.getUsuario().getId() : null)
                .usuarioNombre(log.getUsuario() != null ? log.getUsuario().getUsername() : null)
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .stackTrace(log.getStackTrace())
                .fechaHora(log.getFechaHora())
                .build();
    }
}
