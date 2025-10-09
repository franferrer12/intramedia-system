package com.club.management.service;

import com.club.management.dto.request.JornadaTrabajoRequest;
import com.club.management.dto.response.JornadaTrabajoDTO;
import com.club.management.entity.Empleado;
import com.club.management.entity.Evento;
import com.club.management.entity.JornadaTrabajo;
import com.club.management.repository.EmpleadoRepository;
import com.club.management.repository.EventoRepository;
import com.club.management.repository.JornadaTrabajoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JornadaTrabajoService {

    private final JornadaTrabajoRepository jornadaTrabajoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final EventoRepository eventoRepository;

    /**
     * Obtiene todas las jornadas de trabajo
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findAll() {
        return jornadaTrabajoRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una jornada por ID
     */
    @Transactional(readOnly = true)
    public JornadaTrabajoDTO findById(Long id) {
        JornadaTrabajo jornada = jornadaTrabajoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jornada de trabajo no encontrada con ID: " + id));
        return toDTO(jornada);
    }

    /**
     * Obtiene todas las jornadas de un empleado
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findByEmpleado(Long empleadoId) {
        // Verificar que el empleado existe
        if (!empleadoRepository.existsById(empleadoId)) {
            throw new RuntimeException("Empleado no encontrado con ID: " + empleadoId);
        }
        return jornadaTrabajoRepository.findByEmpleadoIdOrderByFechaDesc(empleadoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene jornadas por fecha
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findByFecha(LocalDate fecha) {
        return jornadaTrabajoRepository.findByFecha(fecha).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene jornadas por periodo (formato YYYY-MM)
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findByPeriodo(String periodo) {
        // Validar formato del periodo
        if (!periodo.matches("^\\d{4}-(0[1-9]|1[0-2])$")) {
            throw new RuntimeException("Formato de periodo inválido. Debe ser YYYY-MM");
        }
        return jornadaTrabajoRepository.findByPeriodo(periodo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene jornadas por rango de fechas
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findByRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        return jornadaTrabajoRepository.findByFechaBetween(fechaInicio, fechaFin).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene jornadas pendientes de pago
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findPendientes() {
        return jornadaTrabajoRepository.findByPagadoFalseOrderByFechaAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene jornadas pendientes por empleado
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findPendientesByEmpleado(Long empleadoId) {
        return jornadaTrabajoRepository.findByEmpleadoIdAndPagadoFalse(empleadoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene jornadas por evento
     */
    @Transactional(readOnly = true)
    public List<JornadaTrabajoDTO> findByEvento(Long eventoId) {
        return jornadaTrabajoRepository.findByEventoId(eventoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crea una nueva jornada de trabajo
     */
    @Transactional
    public JornadaTrabajoDTO create(JornadaTrabajoRequest request) {
        // Verificar que el empleado existe
        Empleado empleado = empleadoRepository.findById(request.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + request.getEmpleadoId()));

        JornadaTrabajo jornada = new JornadaTrabajo();
        jornada.setEmpleado(empleado);
        mapToEntity(request, jornada);

        // Calcular horas trabajadas
        BigDecimal horasTrabajadas = calcularHorasTrabajadas(request.getHoraInicio(), request.getHoraFin());
        jornada.setHorasTrabajadas(horasTrabajadas);

        // Calcular total de pago
        BigDecimal precioHora = request.getPrecioHora() != null
            ? request.getPrecioHora()
            : empleado.getSalarioBase().divide(new BigDecimal("160"), 2, RoundingMode.HALF_UP); // Asumiendo 160 horas mensuales
        jornada.setPrecioHora(precioHora);

        BigDecimal totalPago = calcularTotalPago(horasTrabajadas, precioHora);
        jornada.setTotalPago(totalPago);

        // Si hay evento, verificar que existe
        if (request.getEventoId() != null) {
            Evento evento = eventoRepository.findById(request.getEventoId())
                    .orElseThrow(() -> new RuntimeException("Evento no encontrado con ID: " + request.getEventoId()));
            jornada.setEvento(evento);
        }

        JornadaTrabajo saved = jornadaTrabajoRepository.save(jornada);
        return toDTO(saved);
    }

    /**
     * Actualiza una jornada de trabajo
     */
    @Transactional
    public JornadaTrabajoDTO update(Long id, JornadaTrabajoRequest request) {
        JornadaTrabajo jornada = jornadaTrabajoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jornada de trabajo no encontrada con ID: " + id));

        // Si se cambia el empleado, verificar que el nuevo empleado existe
        if (!jornada.getEmpleado().getId().equals(request.getEmpleadoId())) {
            Empleado nuevoEmpleado = empleadoRepository.findById(request.getEmpleadoId())
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + request.getEmpleadoId()));
            jornada.setEmpleado(nuevoEmpleado);
        }

        mapToEntity(request, jornada);

        // Recalcular horas trabajadas
        BigDecimal horasTrabajadas = calcularHorasTrabajadas(request.getHoraInicio(), request.getHoraFin());
        jornada.setHorasTrabajadas(horasTrabajadas);

        // Recalcular total de pago
        BigDecimal precioHora = request.getPrecioHora() != null
            ? request.getPrecioHora()
            : jornada.getPrecioHora();
        jornada.setPrecioHora(precioHora);

        BigDecimal totalPago = calcularTotalPago(horasTrabajadas, precioHora);
        jornada.setTotalPago(totalPago);

        // Actualizar evento si es necesario
        if (request.getEventoId() != null) {
            if (jornada.getEvento() == null || !jornada.getEvento().getId().equals(request.getEventoId())) {
                Evento evento = eventoRepository.findById(request.getEventoId())
                        .orElseThrow(() -> new RuntimeException("Evento no encontrado con ID: " + request.getEventoId()));
                jornada.setEvento(evento);
            }
        } else {
            jornada.setEvento(null);
        }

        JornadaTrabajo updated = jornadaTrabajoRepository.save(jornada);
        return toDTO(updated);
    }

    /**
     * Elimina una jornada de trabajo
     */
    @Transactional
    public void delete(Long id) {
        if (!jornadaTrabajoRepository.existsById(id)) {
            throw new RuntimeException("Jornada de trabajo no encontrada con ID: " + id);
        }
        jornadaTrabajoRepository.deleteById(id);
    }

    /**
     * Marca una jornada como pagada
     */
    @Transactional
    public JornadaTrabajoDTO marcarComoPagada(Long id, String metodoPago) {
        JornadaTrabajo jornada = jornadaTrabajoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jornada de trabajo no encontrada con ID: " + id));

        jornada.setPagado(true);
        jornada.setFechaPago(LocalDate.now());
        if (metodoPago != null && !metodoPago.isEmpty()) {
            jornada.setMetodoPago(metodoPago);
        }

        JornadaTrabajo updated = jornadaTrabajoRepository.save(jornada);
        return toDTO(updated);
    }

    /**
     * Paga múltiples jornadas a la vez
     */
    @Transactional
    public List<JornadaTrabajoDTO> pagarMultiplesJornadas(List<Long> jornadaIds, String metodoPago) {
        List<JornadaTrabajo> jornadas = jornadaTrabajoRepository.findAllById(jornadaIds);

        if (jornadas.size() != jornadaIds.size()) {
            throw new RuntimeException("Algunas jornadas no fueron encontradas");
        }

        LocalDate fechaPago = LocalDate.now();
        String metodo = metodoPago != null && !metodoPago.isEmpty() ? metodoPago : "EFECTIVO";

        jornadas.forEach(jornada -> {
            jornada.setPagado(true);
            jornada.setFechaPago(fechaPago);
            jornada.setMetodoPago(metodo);
        });

        List<JornadaTrabajo> updated = jornadaTrabajoRepository.saveAll(jornadas);
        return updated.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Obtiene estadísticas de un empleado
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getEstadisticasEmpleado(Long empleadoId) {
        // Verificar que el empleado existe
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + empleadoId));

        Map<String, Object> stats = new HashMap<>();

        // Total pendiente de pago
        Double totalPendiente = jornadaTrabajoRepository.calcularTotalPendientePorEmpleado(empleadoId);
        stats.put("totalPendiente", totalPendiente);

        // Total del mes actual
        YearMonth mesActual = YearMonth.now();
        LocalDate inicioMes = mesActual.atDay(1);
        LocalDate finMes = mesActual.atEndOfMonth();
        Double horasMesActual = jornadaTrabajoRepository.calcularTotalHorasPorEmpleado(empleadoId, inicioMes, finMes);
        Double totalPagadoMesActual = jornadaTrabajoRepository.calcularTotalPagadoPorEmpleado(empleadoId, inicioMes, finMes);

        stats.put("horasMesActual", horasMesActual);
        stats.put("totalPagadoMesActual", totalPagadoMesActual);

        // Jornadas pendientes
        List<JornadaTrabajo> pendientes = jornadaTrabajoRepository.findByEmpleadoIdAndPagadoFalse(empleadoId);
        stats.put("cantidadPendientes", pendientes.size());

        // Nombre del empleado
        stats.put("empleadoNombre", empleado.getNombre() + " " + empleado.getApellidos());

        return stats;
    }

    /**
     * Obtiene estadísticas generales
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getEstadisticasGenerales() {
        Map<String, Object> stats = new HashMap<>();

        // Total pendiente general
        Double totalPendiente = jornadaTrabajoRepository.calcularTotalPendienteGeneral();
        stats.put("totalPendiente", totalPendiente);

        // Cantidad de jornadas pendientes
        Long cantidadPendientes = jornadaTrabajoRepository.countPendientes();
        stats.put("cantidadPendientes", cantidadPendientes);

        return stats;
    }

    // Métodos auxiliares privados

    /**
     * Calcula las horas trabajadas considerando turnos que cruzan la medianoche
     * @param horaInicio Hora de inicio del turno
     * @param horaFin Hora de fin del turno
     * @return Horas trabajadas con 2 decimales
     */
    private BigDecimal calcularHorasTrabajadas(LocalTime horaInicio, LocalTime horaFin) {
        long segundosInicio = horaInicio.toSecondOfDay();
        long segundosFin = horaFin.toSecondOfDay();

        long segundosTrabajados;
        if (segundosFin >= segundosInicio) {
            // Turno normal (no cruza medianoche)
            segundosTrabajados = segundosFin - segundosInicio;
        } else {
            // Turno que cruza medianoche (ej: 23:00 a 03:00)
            // Calculamos: (24:00 - horaInicio) + (horaFin - 00:00)
            segundosTrabajados = (86400 - segundosInicio) + segundosFin;
        }

        // Convertir segundos a horas con 2 decimales
        BigDecimal horas = new BigDecimal(segundosTrabajados)
                .divide(new BigDecimal("3600"), 2, RoundingMode.HALF_UP);

        return horas;
    }

    /**
     * Calcula el total a pagar
     * @param horasTrabajadas Horas trabajadas
     * @param precioHora Precio por hora
     * @return Total a pagar con 2 decimales
     */
    private BigDecimal calcularTotalPago(BigDecimal horasTrabajadas, BigDecimal precioHora) {
        return horasTrabajadas.multiply(precioHora).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Mapea el request a la entidad
     */
    private void mapToEntity(JornadaTrabajoRequest request, JornadaTrabajo jornada) {
        jornada.setFecha(request.getFecha());
        jornada.setHoraInicio(request.getHoraInicio());
        jornada.setHoraFin(request.getHoraFin());
        jornada.setPagado(request.getPagado() != null ? request.getPagado() : false);
        jornada.setFechaPago(request.getFechaPago());
        jornada.setMetodoPago(request.getMetodoPago() != null ? request.getMetodoPago() : "EFECTIVO");
        jornada.setNotas(request.getNotas());
    }

    /**
     * Convierte la entidad a DTO
     */
    private JornadaTrabajoDTO toDTO(JornadaTrabajo jornada) {
        JornadaTrabajoDTO dto = new JornadaTrabajoDTO();
        dto.setId(jornada.getId());
        dto.setEmpleadoId(jornada.getEmpleado().getId());
        dto.setEmpleadoNombre(jornada.getEmpleado().getNombre() + " " + jornada.getEmpleado().getApellidos());
        dto.setEmpleadoDni(jornada.getEmpleado().getDni());
        dto.setFecha(jornada.getFecha());
        dto.setHoraInicio(jornada.getHoraInicio());
        dto.setHoraFin(jornada.getHoraFin());
        dto.setHorasTrabajadas(jornada.getHorasTrabajadas());
        dto.setPrecioHora(jornada.getPrecioHora());
        dto.setTotalPago(jornada.getTotalPago());
        dto.setPagado(jornada.getPagado());
        dto.setFechaPago(jornada.getFechaPago());
        dto.setMetodoPago(jornada.getMetodoPago());

        // Mapear evento si existe
        if (jornada.getEvento() != null) {
            dto.setEventoId(jornada.getEvento().getId());
            dto.setEventoNombre(jornada.getEvento().getNombre());
        }

        dto.setNotas(jornada.getNotas());
        dto.setCreadoEn(jornada.getCreadoEn());
        dto.setActualizadoEn(jornada.getActualizadoEn());

        return dto;
    }
}
