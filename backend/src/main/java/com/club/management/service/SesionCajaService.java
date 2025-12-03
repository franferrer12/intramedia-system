package com.club.management.service;

import com.club.management.dto.AperturaCajaRequest;
import com.club.management.dto.CierreCajaRequest;
import com.club.management.dto.SesionCajaDTO;
import com.club.management.entity.Empleado;
import com.club.management.entity.SesionCaja;
import com.club.management.repository.EmpleadoRepository;
import com.club.management.repository.SesionCajaRepository;
import com.club.management.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de sesiones de caja
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SesionCajaService {

    private final SesionCajaRepository sesionCajaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final VentaRepository ventaRepository;

    @Transactional(readOnly = true)
    public List<SesionCajaDTO> findAll() {
        return sesionCajaRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SesionCajaDTO findById(Long id) {
        SesionCaja sesion = sesionCajaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sesión de caja no encontrada con id: " + id));
        return toDTO(sesion);
    }

    @Transactional(readOnly = true)
    public List<SesionCajaDTO> findSesionesAbiertas() {
        return sesionCajaRepository.findAllSesionesAbiertas().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SesionCajaDTO> findSesionesCerradas(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return sesionCajaRepository.findSesionesCerradasEntreFechas(fechaInicio, fechaFin).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SesionCajaDTO> findByNombreCaja(String nombreCaja) {
        return sesionCajaRepository.findAllByNombreCaja(nombreCaja).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SesionCajaDTO> findByEmpleadoId(Long empleadoId) {
        return sesionCajaRepository.findAllByEmpleadoId(empleadoId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SesionCajaDTO findSesionAbiertaPorNombreCaja(String nombreCaja) {
        return sesionCajaRepository.findSesionAbiertaPorNombreCaja(nombreCaja)
                .map(this::toDTO)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean existeSesionAbierta(String nombreCaja) {
        return sesionCajaRepository.countSesionesAbiertasPorCaja(nombreCaja) > 0;
    }

    /**
     * Abre una nueva sesión de caja
     */
    @Transactional
    public SesionCajaDTO abrirSesion(AperturaCajaRequest request) {
        log.info("Abriendo sesión de caja: {}", request.getNombreCaja());

        // Validar que no exista una sesión abierta para esta caja
        if (existeSesionAbierta(request.getNombreCaja())) {
            throw new RuntimeException("Ya existe una sesión abierta para la caja: " + request.getNombreCaja());
        }

        // Obtener empleado
        Empleado empleado = empleadoRepository.findById(request.getEmpleadoAperturaId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + request.getEmpleadoAperturaId()));

        // Crear sesión
        SesionCaja sesion = SesionCaja.builder()
                .nombreCaja(request.getNombreCaja())
                .empleadoApertura(empleado)
                .fechaApertura(LocalDateTime.now())
                .montoInicial(request.getMontoInicial())
                .estado(SesionCaja.EstadoSesionCaja.ABIERTA)
                .observaciones(request.getObservaciones())
                .build();

        SesionCaja saved = sesionCajaRepository.save(sesion);
        log.info("Sesión de caja abierta exitosamente: id={}, caja={}", saved.getId(), saved.getNombreCaja());

        return toDTO(saved);
    }

    /**
     * Cierra una sesión de caja existente
     */
    @Transactional
    public SesionCajaDTO cerrarSesion(Long sesionId, CierreCajaRequest request) {
        log.info("Cerrando sesión de caja: id={}", sesionId);

        // Obtener sesión
        SesionCaja sesion = sesionCajaRepository.findById(sesionId)
                .orElseThrow(() -> new RuntimeException("Sesión de caja no encontrada con id: " + sesionId));

        // Validar que esté abierta
        if (sesion.getEstado() == SesionCaja.EstadoSesionCaja.CERRADA) {
            throw new RuntimeException("La sesión de caja ya está cerrada");
        }

        // Obtener empleado de cierre
        Empleado empleadoCierre = empleadoRepository.findById(request.getEmpleadoCierreId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + request.getEmpleadoCierreId()));

        // Calcular monto esperado (inicial + ventas)
        BigDecimal montoEsperado = sesion.calcularMontoEsperado();

        // Actualizar sesión
        sesion.setEmpleadoCierre(empleadoCierre);
        sesion.setFechaCierre(LocalDateTime.now());
        sesion.setMontoEsperado(montoEsperado);
        sesion.setMontoReal(request.getMontoReal());
        sesion.setDiferencia(request.getMontoReal().subtract(montoEsperado));
        sesion.setEstado(SesionCaja.EstadoSesionCaja.CERRADA);

        if (request.getObservaciones() != null && !request.getObservaciones().isEmpty()) {
            String observacionesAnteriores = sesion.getObservaciones() != null ? sesion.getObservaciones() + "\n\n" : "";
            sesion.setObservaciones(observacionesAnteriores + "CIERRE: " + request.getObservaciones());
        }

        SesionCaja saved = sesionCajaRepository.save(sesion);

        log.info("Sesión cerrada exitosamente: id={}, diferencia={}", saved.getId(), saved.getDiferencia());

        // Si hay diferencia significativa, hacer log
        if (saved.getDiferencia().abs().compareTo(new BigDecimal("10")) > 0) {
            log.warn("Diferencia significativa en cierre de caja: id={}, diferencia={}",
                    saved.getId(), saved.getDiferencia());
        }

        return toDTO(saved);
    }

    /**
     * Convierte entidad a DTO
     */
    private SesionCajaDTO toDTO(SesionCaja sesion) {
        // Calcular estadísticas
        Integer totalVentas = sesion.getVentas() != null ? sesion.getVentas().size() : 0;
        BigDecimal totalIngresos = sesion.calcularTotalVentas();

        return SesionCajaDTO.builder()
                .id(sesion.getId())
                .nombreCaja(sesion.getNombreCaja())
                .empleadoAperturaId(sesion.getEmpleadoApertura().getId())
                .empleadoAperturaNombre(sesion.getEmpleadoApertura().getNombre())
                .empleadoCierreId(sesion.getEmpleadoCierre() != null ? sesion.getEmpleadoCierre().getId() : null)
                .empleadoCierreNombre(sesion.getEmpleadoCierre() != null ? sesion.getEmpleadoCierre().getNombre() : null)
                .fechaApertura(sesion.getFechaApertura())
                .fechaCierre(sesion.getFechaCierre())
                .montoInicial(sesion.getMontoInicial())
                .montoEsperado(sesion.getMontoEsperado())
                .montoReal(sesion.getMontoReal())
                .diferencia(sesion.getDiferencia())
                .estado(sesion.getEstado())
                .observaciones(sesion.getObservaciones())
                .totalVentas(totalVentas)
                .totalIngresos(totalIngresos)
                .createdAt(sesion.getCreatedAt())
                .updatedAt(sesion.getUpdatedAt())
                .build();
    }
}
