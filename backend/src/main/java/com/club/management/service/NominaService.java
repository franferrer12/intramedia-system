package com.club.management.service;

import com.club.management.dto.request.NominaRequest;
import com.club.management.dto.response.NominaDTO;
import com.club.management.entity.Empleado;
import com.club.management.entity.JornadaTrabajo;
import com.club.management.entity.Nomina;
import com.club.management.repository.EmpleadoRepository;
import com.club.management.repository.JornadaTrabajoRepository;
import com.club.management.repository.NominaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NominaService {

    private final NominaRepository nominaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final JornadaTrabajoRepository jornadaTrabajoRepository;

    // Porcentajes de retención (configurables)
    private static final BigDecimal PORCENTAJE_SEGURIDAD_SOCIAL = new BigDecimal("6.35");
    private static final BigDecimal PORCENTAJE_IRPF = new BigDecimal("15.00");

    @Transactional(readOnly = true)
    public List<NominaDTO> findAll() {
        return nominaRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NominaDTO> findByPeriodo(String periodo) {
        return nominaRepository.findByPeriodo(periodo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NominaDTO> findByEmpleado(Long empleadoId) {
        return nominaRepository.findByEmpleadoIdOrderByPeriodoDesc(empleadoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NominaDTO> findByEstado(String estado) {
        return nominaRepository.findByEstadoOrderByFechaPagoAsc(estado).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NominaDTO findById(Long id) {
        Nomina nomina = nominaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nómina no encontrada con ID: " + id));
        return toDTO(nomina);
    }

    @Transactional(readOnly = true)
    public List<String> getAllPeriodos() {
        return nominaRepository.findAllPeriodos();
    }

    @Transactional(readOnly = true)
    public Double getTotalPagadoPorPeriodo(String periodo) {
        return nominaRepository.getTotalPagadoPorPeriodo(periodo);
    }

    @Transactional(readOnly = true)
    public Double getTotalPendientePorPeriodo(String periodo) {
        return nominaRepository.getTotalPendientePorPeriodo(periodo);
    }

    @Transactional(readOnly = true)
    public Long countByEstado(String estado) {
        return nominaRepository.countByEstado(estado);
    }

    @Transactional
    public NominaDTO create(NominaRequest request) {
        // Verificar que el empleado existe
        Empleado empleado = empleadoRepository.findById(request.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + request.getEmpleadoId()));

        // Verificar que no existe ya una nómina para ese empleado en ese periodo
        nominaRepository.findByEmpleadoIdAndPeriodo(request.getEmpleadoId(), request.getPeriodo())
                .ifPresent(n -> {
                    throw new RuntimeException("Ya existe una nómina para el empleado en el periodo: " + request.getPeriodo());
                });

        Nomina nomina = new Nomina();
        nomina.setEmpleado(empleado);
        mapToEntity(request, nomina);
        calcularImportes(nomina);

        Nomina saved = nominaRepository.save(nomina);
        return toDTO(saved);
    }

    @Transactional
    public NominaDTO update(Long id, NominaRequest request) {
        Nomina nomina = nominaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nómina no encontrada con ID: " + id));

        // Si se cambia el empleado, verificar que el nuevo empleado existe
        if (!nomina.getEmpleado().getId().equals(request.getEmpleadoId())) {
            Empleado nuevoEmpleado = empleadoRepository.findById(request.getEmpleadoId())
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + request.getEmpleadoId()));
            nomina.setEmpleado(nuevoEmpleado);
        }

        mapToEntity(request, nomina);
        calcularImportes(nomina);

        Nomina updated = nominaRepository.save(nomina);
        return toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!nominaRepository.existsById(id)) {
            throw new RuntimeException("Nómina no encontrada con ID: " + id);
        }
        nominaRepository.deleteById(id);
    }

    @Transactional
    public NominaDTO marcarComoPagada(Long id, String metodoPago, String referenciaPago) {
        Nomina nomina = nominaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nómina no encontrada con ID: " + id));

        nomina.setEstado("PAGADA");
        nomina.setMetodoPago(metodoPago);
        nomina.setReferenciaPago(referenciaPago);

        Nomina updated = nominaRepository.save(nomina);
        return toDTO(updated);
    }

    @Transactional
    public NominaDTO cancelar(Long id) {
        Nomina nomina = nominaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nómina no encontrada con ID: " + id));

        nomina.setEstado("CANCELADA");

        Nomina updated = nominaRepository.save(nomina);
        return toDTO(updated);
    }

    /**
     * Genera nóminas automáticas para todos los empleados activos de un periodo
     */
    @Transactional
    public List<NominaDTO> generarNominasMasivas(String periodo) {
        // Validar formato del periodo
        if (!periodo.matches("^\\d{4}-(0[1-9]|1[0-2])$")) {
            throw new RuntimeException("Formato de periodo inválido. Debe ser YYYY-MM");
        }

        // Obtener todos los empleados activos
        List<Empleado> empleadosActivos = empleadoRepository.findByActivoTrue();

        // Generar nóminas
        List<Nomina> nominas = empleadosActivos.stream()
                .filter(empleado -> {
                    // Verificar que no exista ya una nómina para este empleado en este periodo
                    return nominaRepository.findByEmpleadoIdAndPeriodo(empleado.getId(), periodo).isEmpty();
                })
                .map(empleado -> {
                    Nomina nomina = new Nomina();
                    nomina.setEmpleado(empleado);
                    nomina.setPeriodo(periodo);
                    nomina.setSalarioBase(empleado.getSalarioBase());
                    nomina.setHorasExtra(BigDecimal.ZERO);
                    nomina.setPrecioHoraExtra(BigDecimal.ZERO);
                    nomina.setBonificaciones(BigDecimal.ZERO);
                    nomina.setDeducciones(BigDecimal.ZERO);
                    nomina.setOtrasRetenciones(BigDecimal.ZERO);
                    nomina.setEstado("PENDIENTE");

                    // Calcular fecha de pago: último día del mes del periodo
                    YearMonth yearMonth = YearMonth.parse(periodo);
                    nomina.setFechaPago(yearMonth.atEndOfMonth());

                    calcularImportes(nomina);
                    return nomina;
                })
                .collect(Collectors.toList());

        List<Nomina> saved = nominaRepository.saveAll(nominas);
        return saved.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Genera nómina para un empleado desde sus jornadas pagadas del periodo
     * Este método crea una nómina mensual que refleja todas las jornadas trabajadas y pagadas
     */
    @Transactional
    public NominaDTO generarNominaDesdeJornadas(Long empleadoId, String periodo) {
        // Validar formato del periodo
        if (!periodo.matches("^\\d{4}-(0[1-9]|1[0-2])$")) {
            throw new RuntimeException("Formato de periodo inválido. Debe ser YYYY-MM");
        }

        // Verificar que el empleado existe
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con ID: " + empleadoId));

        // Verificar que no existe ya una nómina para ese empleado en ese periodo
        nominaRepository.findByEmpleadoIdAndPeriodo(empleadoId, periodo)
                .ifPresent(n -> {
                    throw new RuntimeException("Ya existe una nómina para el empleado en el periodo: " + periodo);
                });

        // Obtener todas las jornadas PAGADAS del empleado en ese periodo que NO estén ya en una nómina
        List<JornadaTrabajo> jornadas = jornadaTrabajoRepository.findByEmpleadoIdAndPeriodo(empleadoId, periodo)
                .stream()
                .filter(j -> j.getPagado() && j.getNomina() == null)
                .collect(Collectors.toList());

        if (jornadas.isEmpty()) {
            throw new RuntimeException("No hay jornadas pagadas para incluir en la nómina del periodo " + periodo);
        }

        // Calcular totales de las jornadas
        BigDecimal totalHorasTrabajadas = jornadas.stream()
                .map(JornadaTrabajo::getHorasTrabajadas)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPagadoJornadas = jornadas.stream()
                .map(JornadaTrabajo::getTotalPago)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Crear la nómina
        Nomina nomina = new Nomina();
        nomina.setEmpleado(empleado);
        nomina.setPeriodo(periodo);
        nomina.setSalarioBase(empleado.getSalarioBase() != null ? empleado.getSalarioBase() : BigDecimal.ZERO);

        // Las jornadas se consideran como "salario variable" o "horas extra"
        nomina.setHorasExtra(totalHorasTrabajadas);

        // Calcular precio hora promedio de las jornadas
        BigDecimal precioHoraPromedio = totalHorasTrabajadas.compareTo(BigDecimal.ZERO) > 0
                ? totalPagadoJornadas.divide(totalHorasTrabajadas, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        nomina.setPrecioHoraExtra(precioHoraPromedio);

        nomina.setBonificaciones(BigDecimal.ZERO);
        nomina.setDeducciones(BigDecimal.ZERO);
        nomina.setOtrasRetenciones(BigDecimal.ZERO);
        nomina.setEstado("PENDIENTE");
        nomina.setNotas("Nómina generada automáticamente desde " + jornadas.size() + " jornadas trabajadas");

        // Calcular fecha de pago: último día del mes del periodo
        YearMonth yearMonth = YearMonth.parse(periodo);
        nomina.setFechaPago(yearMonth.atEndOfMonth());

        // Calcular importes con retenciones fiscales
        calcularImportes(nomina);

        // Guardar la nómina
        Nomina saved = nominaRepository.save(nomina);

        // Vincular las jornadas con la nómina creada
        jornadas.forEach(jornada -> {
            jornada.setNomina(saved);
        });
        jornadaTrabajoRepository.saveAll(jornadas);

        return toDTO(saved);
    }

    /**
     * Genera nóminas desde jornadas para todos los empleados activos del periodo
     */
    @Transactional
    public List<NominaDTO> generarNominasMasivasDesdeJornadas(String periodo) {
        // Validar formato del periodo
        if (!periodo.matches("^\\d{4}-(0[1-9]|1[0-2])$")) {
            throw new RuntimeException("Formato de periodo inválido. Debe ser YYYY-MM");
        }

        // Obtener todos los empleados activos que tengan jornadas pagadas en el periodo
        List<Empleado> empleadosActivos = empleadoRepository.findByActivoTrue();

        List<NominaDTO> nominasGeneradas = empleadosActivos.stream()
                .filter(empleado -> {
                    // Verificar que no exista ya una nómina
                    if (nominaRepository.findByEmpleadoIdAndPeriodo(empleado.getId(), periodo).isPresent()) {
                        return false;
                    }
                    // Verificar que tenga jornadas pagadas sin vincular
                    List<JornadaTrabajo> jornadas = jornadaTrabajoRepository.findByEmpleadoIdAndPeriodo(empleado.getId(), periodo);
                    return jornadas.stream().anyMatch(j -> j.getPagado() && j.getNomina() == null);
                })
                .map(empleado -> {
                    try {
                        return generarNominaDesdeJornadas(empleado.getId(), periodo);
                    } catch (Exception e) {
                        // Log error pero continuar con otros empleados
                        return null;
                    }
                })
                .filter(nomina -> nomina != null)
                .collect(Collectors.toList());

        return nominasGeneradas;
    }

    // Métodos auxiliares

    private void mapToEntity(NominaRequest request, Nomina nomina) {
        nomina.setPeriodo(request.getPeriodo());
        nomina.setFechaPago(request.getFechaPago());
        nomina.setSalarioBase(request.getSalarioBase());
        nomina.setHorasExtra(request.getHorasExtra() != null ? request.getHorasExtra() : BigDecimal.ZERO);
        nomina.setPrecioHoraExtra(request.getPrecioHoraExtra() != null ? request.getPrecioHoraExtra() : BigDecimal.ZERO);
        nomina.setBonificaciones(request.getBonificaciones() != null ? request.getBonificaciones() : BigDecimal.ZERO);
        nomina.setDeducciones(request.getDeducciones() != null ? request.getDeducciones() : BigDecimal.ZERO);
        nomina.setOtrasRetenciones(request.getOtrasRetenciones() != null ? request.getOtrasRetenciones() : BigDecimal.ZERO);
        nomina.setEstado(request.getEstado() != null ? request.getEstado() : "PENDIENTE");
        nomina.setMetodoPago(request.getMetodoPago());
        nomina.setReferenciaPago(request.getReferenciaPago());
        nomina.setNotas(request.getNotas());
    }

    /**
     * Calcula automáticamente los importes de la nómina
     */
    private void calcularImportes(Nomina nomina) {
        // Calcular extras por horas
        BigDecimal importeHorasExtra = nomina.getHorasExtra()
                .multiply(nomina.getPrecioHoraExtra())
                .setScale(2, RoundingMode.HALF_UP);

        // Calcular salario bruto
        BigDecimal salarioBruto = nomina.getSalarioBase()
                .add(importeHorasExtra)
                .add(nomina.getBonificaciones())
                .subtract(nomina.getDeducciones())
                .setScale(2, RoundingMode.HALF_UP);

        nomina.setSalarioBruto(salarioBruto);

        // Calcular Seguridad Social (6.35% del bruto)
        BigDecimal seguridadSocial = salarioBruto
                .multiply(PORCENTAJE_SEGURIDAD_SOCIAL)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        nomina.setSeguridadSocial(seguridadSocial);

        // Calcular IRPF (15% del bruto)
        BigDecimal irpf = salarioBruto
                .multiply(PORCENTAJE_IRPF)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        nomina.setIrpf(irpf);

        // Calcular salario neto
        BigDecimal salarioNeto = salarioBruto
                .subtract(seguridadSocial)
                .subtract(irpf)
                .subtract(nomina.getOtrasRetenciones())
                .setScale(2, RoundingMode.HALF_UP);

        nomina.setSalarioNeto(salarioNeto);
    }

    private NominaDTO toDTO(Nomina nomina) {
        NominaDTO dto = new NominaDTO();
        dto.setId(nomina.getId());
        dto.setEmpleadoId(nomina.getEmpleado().getId());
        dto.setEmpleadoNombre(nomina.getEmpleado().getNombre() + " " + nomina.getEmpleado().getApellidos());
        dto.setEmpleadoDni(nomina.getEmpleado().getDni());
        dto.setPeriodo(nomina.getPeriodo());
        dto.setFechaPago(nomina.getFechaPago());
        dto.setSalarioBase(nomina.getSalarioBase());
        dto.setHorasExtra(nomina.getHorasExtra());
        dto.setPrecioHoraExtra(nomina.getPrecioHoraExtra());
        dto.setBonificaciones(nomina.getBonificaciones());
        dto.setDeducciones(nomina.getDeducciones());
        dto.setSalarioBruto(nomina.getSalarioBruto());
        dto.setSeguridadSocial(nomina.getSeguridadSocial());
        dto.setIrpf(nomina.getIrpf());
        dto.setOtrasRetenciones(nomina.getOtrasRetenciones());
        dto.setSalarioNeto(nomina.getSalarioNeto());
        dto.setEstado(nomina.getEstado());
        dto.setMetodoPago(nomina.getMetodoPago());
        dto.setReferenciaPago(nomina.getReferenciaPago());
        dto.setNotas(nomina.getNotas());
        dto.setCreadoEn(nomina.getCreadoEn());
        dto.setActualizadoEn(nomina.getActualizadoEn());
        return dto;
    }
}
