package com.club.management.service;

import com.club.management.dto.DashboardStatsDTO;
import com.club.management.dto.DashboardStatsDTO.ProximoEventoDTO;
import com.club.management.dto.DashboardStatsDTO.ActividadRecienteDTO;
import com.club.management.entity.Evento;
import com.club.management.entity.Evento.EstadoEvento;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EventoRepository eventoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProveedorRepository proveedorRepository;
    private final TransaccionRepository transaccionRepository;

    public DashboardStatsDTO getDashboardStats() {
        // Calcular estadísticas
        Integer eventosActivos = calcularEventosActivos();
        Integer totalUsuarios = (int) usuarioRepository.countByActivoTrue();
        Integer totalProveedores = (int) proveedorRepository.countByActivoTrue();
        BigDecimal ingresosMes = calcularIngresosMes();

        // Obtener próximos eventos
        List<ProximoEventoDTO> proximosEventos = obtenerProximosEventos();

        // Obtener actividad reciente
        List<ActividadRecienteDTO> actividadReciente = obtenerActividadReciente();

        return DashboardStatsDTO.builder()
                .eventosActivos(eventosActivos)
                .totalUsuarios(totalUsuarios)
                .totalProveedores(totalProveedores)
                .ingresosMes(ingresosMes)
                .proximosEventos(proximosEventos)
                .actividadReciente(actividadReciente)
                .build();
    }

    private Integer calcularEventosActivos() {
        LocalDate hoy = LocalDate.now();
        LocalDate finMes = hoy.plusMonths(1);
        long count = eventoRepository.countByFechaBetweenAndEstadoIn(
                hoy, finMes,
                List.of(EstadoEvento.PLANIFICADO, EstadoEvento.CONFIRMADO, EstadoEvento.EN_CURSO)
        );
        return (int) count;
    }

    private BigDecimal calcularIngresosMes() {
        LocalDate inicioMes = LocalDate.now().withDayOfMonth(1);
        LocalDate finMes = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        BigDecimal ingresos = transaccionRepository.sumByTipoAndFechaBetween(
                com.club.management.entity.Transaccion.TipoTransaccion.INGRESO, inicioMes, finMes
        );

        return ingresos != null ? ingresos : BigDecimal.ZERO;
    }

    private List<ProximoEventoDTO> obtenerProximosEventos() {
        LocalDate hoy = LocalDate.now();
        LocalDate proximoMes = hoy.plusMonths(1);

        List<Evento> eventos = eventoRepository.findTop5ByFechaBetweenAndEstadoInOrderByFechaAsc(
                hoy, proximoMes,
                List.of(EstadoEvento.PLANIFICADO, EstadoEvento.CONFIRMADO)
        );

        return eventos.stream()
                .map(evento -> ProximoEventoDTO.builder()
                        .id(evento.getId())
                        .nombre(evento.getNombre())
                        .fecha(formatearFecha(evento.getFecha()))
                        .hora(evento.getHoraInicio() != null ? evento.getHoraInicio().toString() : "Por definir")
                        .estado(formatearEstado(evento.getEstado()))
                        .build())
                .collect(Collectors.toList());
    }

    private List<ActividadRecienteDTO> obtenerActividadReciente() {
        List<ActividadRecienteDTO> actividades = new ArrayList<>();

        try {
            LocalDateTime hace24Horas = LocalDateTime.now().minusHours(24);

            // Eventos recientes
            List<Evento> eventosRecientes = eventoRepository.findTop3ByCreadoEnAfterOrderByCreadoEnDesc(hace24Horas);
            for (Evento evento : eventosRecientes) {
                if (evento.getCreadoEn() != null) {
                    actividades.add(ActividadRecienteDTO.builder()
                            .tipo("EVENTO_CREADO")
                            .descripcion("Evento creado: " + evento.getNombre())
                            .fechaHora(evento.getCreadoEn().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                            .tiempoRelativo(calcularTiempoRelativo(evento.getCreadoEn()))
                            .build());
                }
            }

            // Ordenar por fecha
            actividades.sort((a, b) -> b.getFechaHora().compareTo(a.getFechaHora()));
        } catch (Exception e) {
            // Si hay error, retornar lista vacía
            System.err.println("Error obteniendo actividad reciente: " + e.getMessage());
        }

        // Limitar a 5 actividades
        return actividades.stream().limit(5).collect(Collectors.toList());
    }

    private String formatearFecha(LocalDate fecha) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEEE d MMM");
        return fecha.format(formatter);
    }

    private String formatearEstado(EstadoEvento estado) {
        return switch (estado) {
            case PLANIFICADO -> "Programado";
            case CONFIRMADO -> "Confirmado";
            case EN_CURSO -> "En Curso";
            case FINALIZADO -> "Finalizado";
            case CANCELADO -> "Cancelado";
        };
    }

    private String calcularTiempoRelativo(LocalDateTime fecha) {
        long minutos = ChronoUnit.MINUTES.between(fecha, LocalDateTime.now());

        if (minutos < 1) {
            return "Justo ahora";
        } else if (minutos < 60) {
            return "Hace " + minutos + " minuto" + (minutos > 1 ? "s" : "");
        }

        long horas = ChronoUnit.HOURS.between(fecha, LocalDateTime.now());
        if (horas < 24) {
            return "Hace " + horas + " hora" + (horas > 1 ? "s" : "");
        }

        long dias = ChronoUnit.DAYS.between(fecha, LocalDateTime.now());
        return "Hace " + dias + " día" + (dias > 1 ? "s" : "");
    }
}
