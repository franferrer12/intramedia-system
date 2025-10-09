package com.club.management.service;

import com.club.management.dto.response.*;
import com.club.management.entity.Empleado;
import com.club.management.entity.Evento;
import com.club.management.entity.JornadaTrabajo;
import com.club.management.entity.Transaccion;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para análisis de métricas empresariales y analytics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final JornadaTrabajoRepository jornadaTrabajoRepository;
    private final NominaRepository nominaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final EventoRepository eventoRepository;
    private final TransaccionRepository transaccionRepository;

    private static final DateTimeFormatter PERIODO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    /**
     * Obtiene las métricas de costes laborales para un periodo específico
     *
     * @param periodo Periodo en formato YYYY-MM
     * @return DTO con métricas de costes laborales
     */
    @Transactional(readOnly = true)
    public CostesLaboralesDTO getCostesLaborales(String periodo) {
        log.info("Calculando costes laborales para el periodo: {}", periodo);

        // Obtener jornadas del periodo
        List<JornadaTrabajo> jornadas = jornadaTrabajoRepository.findByPeriodo(periodo);

        // Calcular total pagado en jornadas
        BigDecimal totalPagadoMes = jornadas.stream()
                .map(JornadaTrabajo::getTotalPago)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calcular total de nóminas del mes
        BigDecimal totalNominaMes = nominaRepository.findByPeriodo(periodo).stream()
                .map(nomina -> nomina.getSalarioNeto() != null ? nomina.getSalarioNeto() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Contar empleados únicos
        long cantidadEmpleados = jornadas.stream()
                .map(j -> j.getEmpleado().getId())
                .distinct()
                .count();

        // Cantidad de jornadas
        long cantidadJornadas = jornadas.size();

        // Calcular total de horas trabajadas
        BigDecimal totalHoras = jornadas.stream()
                .map(JornadaTrabajo::getHorasTrabajadas)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calcular promedios
        BigDecimal promedioCosteJornada = cantidadJornadas > 0
                ? totalPagadoMes.divide(BigDecimal.valueOf(cantidadJornadas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal costePorHora = totalHoras.compareTo(BigDecimal.ZERO) > 0
                ? totalPagadoMes.divide(totalHoras, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Obtener tendencia de últimos 6 meses
        List<MesCoste> tendencia = getEvolucionCostesLaborales(6);

        return CostesLaboralesDTO.builder()
                .totalPagadoMes(totalPagadoMes)
                .totalNominaMes(totalNominaMes)
                .cantidadEmpleados(cantidadEmpleados)
                .cantidadJornadas(cantidadJornadas)
                .promedioCosteJornada(promedioCosteJornada)
                .costePorHora(costePorHora)
                .periodo(periodo)
                .tendenciaMensual(tendencia)
                .totalHorasTrabajadas(totalHoras)
                .build();
    }

    /**
     * Obtiene el rendimiento de un empleado en un rango de fechas
     *
     * @param empleadoId ID del empleado
     * @param periodoInicio Fecha de inicio en formato YYYY-MM
     * @param periodoFin Fecha de fin en formato YYYY-MM
     * @return DTO con análisis de rendimiento del empleado
     */
    @Transactional(readOnly = true)
    public RendimientoEmpleadoDTO getRendimientoPorEmpleado(Long empleadoId, String periodoInicio, String periodoFin) {
        log.info("Calculando rendimiento del empleado {} desde {} hasta {}", empleadoId, periodoInicio, periodoFin);

        // Validar que el empleado existe
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + empleadoId));

        // Convertir periodos a fechas
        LocalDate fechaInicio = YearMonth.parse(periodoInicio, PERIODO_FORMATTER).atDay(1);
        LocalDate fechaFin = YearMonth.parse(periodoFin, PERIODO_FORMATTER).atEndOfMonth();

        // Obtener jornadas del empleado en el rango
        List<JornadaTrabajo> jornadas = jornadaTrabajoRepository.findByEmpleadoIdAndFechaBetween(
                empleadoId, fechaInicio, fechaFin);

        // Calcular total de horas trabajadas
        BigDecimal totalHoras = jornadas.stream()
                .map(JornadaTrabajo::getHorasTrabajadas)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total de jornadas
        long totalJornadas = jornadas.size();

        // Total pagado
        BigDecimal totalPagado = jornadas.stream()
                .map(JornadaTrabajo::getTotalPago)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calcular promedios
        BigDecimal promedioHorasPorJornada = totalJornadas > 0
                ? totalHoras.divide(BigDecimal.valueOf(totalJornadas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal promedioIngresoPorJornada = totalJornadas > 0
                ? totalPagado.divide(BigDecimal.valueOf(totalJornadas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal precioPromedioHora = totalHoras.compareTo(BigDecimal.ZERO) > 0
                ? totalPagado.divide(totalHoras, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Jornadas pendientes
        List<JornadaTrabajo> jornadasPendientes = jornadaTrabajoRepository.findByEmpleadoIdAndPagadoFalse(empleadoId);
        long cantidadPendientes = jornadasPendientes.size();
        BigDecimal importePendiente = jornadasPendientes.stream()
                .map(JornadaTrabajo::getTotalPago)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return RendimientoEmpleadoDTO.builder()
                .empleadoId(empleadoId)
                .empleadoNombre(empleado.getNombre() + " " + empleado.getApellidos())
                .totalHorasTrabajadas(totalHoras)
                .totalJornadas(totalJornadas)
                .totalPagado(totalPagado)
                .promedioHorasPorJornada(promedioHorasPorJornada)
                .promedioIngresoPorJornada(promedioIngresoPorJornada)
                .periodoInicio(periodoInicio)
                .periodoFin(periodoFin)
                .precioPromedioHora(precioPromedioHora)
                .jornadasPendientes(cantidadPendientes)
                .importePendiente(importePendiente)
                .build();
    }

    /**
     * Obtiene el análisis de rentabilidad de eventos en un rango de fechas
     *
     * @param fechaInicio Fecha de inicio
     * @param fechaFin Fecha de fin
     * @return Lista de DTOs con análisis de rentabilidad por evento
     */
    @Transactional(readOnly = true)
    public List<AnalisisRentabilidadDTO> getAnalisisRentabilidadEventos(LocalDate fechaInicio, LocalDate fechaFin) {
        log.info("Calculando análisis de rentabilidad de eventos desde {} hasta {}", fechaInicio, fechaFin);

        // Obtener eventos en el rango de fechas
        List<Evento> eventos = eventoRepository.findByFechaBetween(fechaInicio, fechaFin);

        return eventos.stream().map(evento -> {
            // Obtener ingresos del evento
            BigDecimal ingresos = transaccionRepository.sumByEventoIdAndTipo(
                    evento.getId(), Transaccion.TipoTransaccion.INGRESO);
            if (ingresos == null) ingresos = BigDecimal.ZERO;

            // Obtener gastos (transacciones)
            BigDecimal otrosGastos = transaccionRepository.sumByEventoIdAndTipo(
                    evento.getId(), Transaccion.TipoTransaccion.GASTO);
            if (otrosGastos == null) otrosGastos = BigDecimal.ZERO;

            // Obtener costes de personal (jornadas)
            List<JornadaTrabajo> jornadasEvento = jornadaTrabajoRepository.findByEventoId(evento.getId());
            BigDecimal costesPersonal = jornadasEvento.stream()
                    .map(JornadaTrabajo::getTotalPago)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Calcular gastos totales
            BigDecimal gastosTotal = costesPersonal.add(otrosGastos);

            // Calcular margen bruto
            BigDecimal margenBruto = ingresos.subtract(gastosTotal);

            // Calcular porcentaje de margen
            BigDecimal porcentajeMargen = ingresos.compareTo(BigDecimal.ZERO) > 0
                    ? margenBruto.divide(ingresos, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            // Contar empleados únicos
            long cantidadEmpleados = jornadasEvento.stream()
                    .map(j -> j.getEmpleado().getId())
                    .distinct()
                    .count();

            // Calcular ingreso por persona
            BigDecimal ingresoPorPersona = BigDecimal.ZERO;
            if (evento.getAforoReal() != null && evento.getAforoReal() > 0) {
                ingresoPorPersona = ingresos.divide(
                        BigDecimal.valueOf(evento.getAforoReal()), 2, RoundingMode.HALF_UP);
            }

            return AnalisisRentabilidadDTO.builder()
                    .eventoId(evento.getId())
                    .eventoNombre(evento.getNombre())
                    .eventoFecha(evento.getFecha())
                    .eventoTipo(evento.getTipo() != null ? evento.getTipo().name() : null)
                    .eventoEstado(evento.getEstado() != null ? evento.getEstado().name() : null)
                    .ingresosEvento(ingresos)
                    .costesPersonal(costesPersonal)
                    .otrosGastos(otrosGastos)
                    .gastosTotal(gastosTotal)
                    .margenBruto(margenBruto)
                    .porcentajeMargen(porcentajeMargen)
                    .cantidadEmpleados(cantidadEmpleados)
                    .aforoReal(evento.getAforoReal())
                    .ingresoPorPersona(ingresoPorPersona)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Obtiene las métricas principales del dashboard
     *
     * @return DTO con métricas del dashboard
     */
    @Transactional(readOnly = true)
    public DashboardMetricsDTO getDashboardMetrics() {
        log.info("Calculando métricas del dashboard");

        // Obtener mes actual y anterior
        LocalDate hoy = LocalDate.now();
        String mesActual = hoy.format(PERIODO_FORMATTER);
        String mesAnterior = hoy.minusMonths(1).format(PERIODO_FORMATTER);

        // Obtener jornadas del mes actual
        List<JornadaTrabajo> jornadasMesActual = jornadaTrabajoRepository.findByPeriodo(mesActual);
        BigDecimal costesLaboralesMesActual = jornadasMesActual.stream()
                .map(JornadaTrabajo::getTotalPago)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Obtener jornadas del mes anterior
        List<JornadaTrabajo> jornadasMesAnterior = jornadaTrabajoRepository.findByPeriodo(mesAnterior);
        BigDecimal costesLaboralesMesAnterior = jornadasMesAnterior.stream()
                .map(JornadaTrabajo::getTotalPago)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calcular variación mensual
        BigDecimal variacionMensual = BigDecimal.ZERO;
        if (costesLaboralesMesAnterior.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diferencia = costesLaboralesMesActual.subtract(costesLaboralesMesAnterior);
            variacionMensual = diferencia.divide(costesLaboralesMesAnterior, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        // Jornadas pendientes de pago
        Long jornadasPendientes = jornadaTrabajoRepository.countPendientes();
        Double importePendienteDouble = jornadaTrabajoRepository.calcularTotalPendienteGeneral();
        BigDecimal importePendiente = BigDecimal.valueOf(importePendienteDouble != null ? importePendienteDouble : 0.0);

        // Empleados activos
        Long empleadosActivos = empleadoRepository.countActivos();

        // Total de horas del mes actual
        BigDecimal totalHorasMesActual = jornadasMesActual.stream()
                .map(JornadaTrabajo::getHorasTrabajadas)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Promedio de coste por hora
        BigDecimal promedioCosteHora = totalHorasMesActual.compareTo(BigDecimal.ZERO) > 0
                ? costesLaboralesMesActual.divide(totalHorasMesActual, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Tendencia de últimos 6 meses
        List<MesCoste> tendencia = getEvolucionCostesLaborales(6);

        // Nóminas pendientes
        Long nominasPendientes = nominaRepository.countByEstado("PENDIENTE");

        // Total de nóminas del mes actual
        BigDecimal totalNominasMesActual = nominaRepository.findByPeriodo(mesActual).stream()
                .map(nomina -> nomina.getSalarioNeto() != null ? nomina.getSalarioNeto() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DashboardMetricsDTO.builder()
                .costesLaboralesMesActual(costesLaboralesMesActual)
                .costesLaboralesMesAnterior(costesLaboralesMesAnterior)
                .variacionMensual(variacionMensual)
                .jornadasPendientesPago(jornadasPendientes)
                .importePendientePago(importePendiente)
                .empleadosActivos(empleadosActivos)
                .promedioCosteHora(promedioCosteHora)
                .ultimos6MesesTendencia(tendencia)
                .mesActual(mesActual)
                .mesAnterior(mesAnterior)
                .totalHorasMesActual(totalHorasMesActual)
                .cantidadJornadasMesActual((long) jornadasMesActual.size())
                .nominasPendientes(nominasPendientes)
                .totalNominasMesActual(totalNominasMesActual)
                .build();
    }

    /**
     * Obtiene la evolución de costes laborales de los últimos N meses
     *
     * @param meses Cantidad de meses a analizar
     * @return Lista de costes por mes
     */
    @Transactional(readOnly = true)
    public List<MesCoste> getEvolucionCostesLaborales(int meses) {
        log.info("Calculando evolución de costes laborales de los últimos {} meses", meses);

        LocalDate fechaActual = LocalDate.now();
        List<MesCoste> evolucion = new ArrayList<>();

        for (int i = meses - 1; i >= 0; i--) {
            LocalDate fecha = fechaActual.minusMonths(i);
            String periodo = fecha.format(PERIODO_FORMATTER);

            List<JornadaTrabajo> jornadas = jornadaTrabajoRepository.findByPeriodo(periodo);

            BigDecimal total = jornadas.stream()
                    .map(JornadaTrabajo::getTotalPago)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long cantidadJornadas = jornadas.size();

            long cantidadEmpleados = jornadas.stream()
                    .map(j -> j.getEmpleado().getId())
                    .distinct()
                    .count();

            evolucion.add(MesCoste.builder()
                    .periodo(periodo)
                    .total(total)
                    .cantidadJornadas(cantidadJornadas)
                    .cantidadEmpleados(cantidadEmpleados)
                    .build());
        }

        return evolucion;
    }

    /**
     * Obtiene la comparativa de costes laborales por cada mes de un año específico
     *
     * @param año Año a analizar
     * @return Mapa con periodo y total de costes
     */
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getComparativaCostesAnual(int año) {
        log.info("Calculando comparativa anual de costes para el año {}", año);

        Map<String, BigDecimal> comparativa = new LinkedHashMap<>();

        for (int mes = 1; mes <= 12; mes++) {
            String periodo = String.format("%d-%02d", año, mes);
            List<JornadaTrabajo> jornadas = jornadaTrabajoRepository.findByPeriodo(periodo);

            BigDecimal total = jornadas.stream()
                    .map(JornadaTrabajo::getTotalPago)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            comparativa.put(periodo, total);
        }

        return comparativa;
    }
}
