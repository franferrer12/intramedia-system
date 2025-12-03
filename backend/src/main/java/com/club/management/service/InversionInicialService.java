package com.club.management.service;

import com.club.management.dto.request.InversionInicialRequest;
import com.club.management.dto.response.InversionInicialDTO;
import com.club.management.entity.ActivoFijo;
import com.club.management.entity.InversionInicial;
import com.club.management.entity.InversionInicial.CategoriaInversion;
import com.club.management.entity.Proveedor;
import com.club.management.repository.ActivoFijoRepository;
import com.club.management.repository.InversionInicialRepository;
import com.club.management.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InversionInicialService {

    private final InversionInicialRepository inversionInicialRepository;
    private final ActivoFijoRepository activoFijoRepository;
    private final ProveedorRepository proveedorRepository;

    /**
     * Crea una nueva inversión inicial
     */
    public InversionInicialDTO crearInversion(InversionInicialRequest request) {
        log.info("Creando nueva inversión inicial: {}", request.getConcepto());

        // Validar categoría
        CategoriaInversion categoria = validarCategoria(request.getCategoria());

        // Validar activo fijo si se especifica
        ActivoFijo activoFijo = null;
        if (request.getActivoFijoId() != null) {
            activoFijo = activoFijoRepository.findById(request.getActivoFijoId())
                    .orElseThrow(() -> new RuntimeException("Activo fijo no encontrado con id: " + request.getActivoFijoId()));
        }

        // Validar proveedor si se especifica
        Proveedor proveedor = null;
        if (request.getProveedorId() != null) {
            proveedor = proveedorRepository.findById(request.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + request.getProveedorId()));
        }

        // Construir entidad
        InversionInicial inversion = InversionInicial.builder()
                .concepto(request.getConcepto())
                .descripcion(request.getDescripcion())
                .categoria(categoria)
                .monto(request.getMonto())
                .fecha(request.getFecha())
                .activoFijo(activoFijo)
                .proveedor(proveedor)
                .numeroFactura(request.getNumeroFactura())
                .formaPago(request.getFormaPago())
                .build();

        // Guardar
        InversionInicial saved = inversionInicialRepository.save(inversion);

        log.info("Inversión inicial creada exitosamente con id: {}", saved.getId());
        return toDTO(saved);
    }

    /**
     * Actualiza una inversión inicial existente
     */
    public InversionInicialDTO actualizarInversion(Long id, InversionInicialRequest request) {
        log.info("Actualizando inversión inicial con id: {}", id);

        // Buscar inversión existente
        InversionInicial inversion = inversionInicialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inversión inicial no encontrada con id: " + id));

        // Validar categoría
        CategoriaInversion categoria = validarCategoria(request.getCategoria());

        // Validar activo fijo si se especifica
        ActivoFijo activoFijo = null;
        if (request.getActivoFijoId() != null) {
            activoFijo = activoFijoRepository.findById(request.getActivoFijoId())
                    .orElseThrow(() -> new RuntimeException("Activo fijo no encontrado con id: " + request.getActivoFijoId()));
        }

        // Validar proveedor si se especifica
        Proveedor proveedor = null;
        if (request.getProveedorId() != null) {
            proveedor = proveedorRepository.findById(request.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + request.getProveedorId()));
        }

        // Actualizar campos
        inversion.setConcepto(request.getConcepto());
        inversion.setDescripcion(request.getDescripcion());
        inversion.setCategoria(categoria);
        inversion.setMonto(request.getMonto());
        inversion.setFecha(request.getFecha());
        inversion.setActivoFijo(activoFijo);
        inversion.setProveedor(proveedor);
        inversion.setNumeroFactura(request.getNumeroFactura());
        inversion.setFormaPago(request.getFormaPago());

        // Guardar
        InversionInicial updated = inversionInicialRepository.save(inversion);

        log.info("Inversión inicial actualizada exitosamente con id: {}", updated.getId());
        return toDTO(updated);
    }

    /**
     * Obtiene una inversión inicial por su ID
     */
    @Transactional(readOnly = true)
    public InversionInicialDTO obtenerPorId(Long id) {
        log.debug("Obteniendo inversión inicial con id: {}", id);

        InversionInicial inversion = inversionInicialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inversión inicial no encontrada con id: " + id));

        return toDTO(inversion);
    }

    /**
     * Lista todas las inversiones iniciales ordenadas por fecha descendente
     */
    @Transactional(readOnly = true)
    public List<InversionInicialDTO> listarTodas() {
        log.debug("Listando todas las inversiones iniciales");

        return inversionInicialRepository.findAllByOrderByFechaDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lista inversiones iniciales por categoría
     */
    @Transactional(readOnly = true)
    public List<InversionInicialDTO> listarPorCategoria(String categoria) {
        log.debug("Listando inversiones iniciales por categoría: {}", categoria);

        // Validar categoría
        CategoriaInversion categoriaEnum = validarCategoria(categoria);

        return inversionInicialRepository.findByCategoria(categoriaEnum)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Elimina (hard delete) una inversión inicial
     */
    public void eliminar(Long id) {
        log.info("Eliminando inversión inicial con id: {}", id);

        InversionInicial inversion = inversionInicialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inversión inicial no encontrada con id: " + id));

        inversionInicialRepository.delete(inversion);

        log.info("Inversión inicial eliminada exitosamente con id: {}", id);
    }

    /**
     * Busca inversiones iniciales por concepto (búsqueda parcial, case insensitive)
     */
    @Transactional(readOnly = true)
    public List<InversionInicialDTO> buscarPorConcepto(String concepto) {
        log.debug("Buscando inversiones iniciales por concepto: {}", concepto);

        if (concepto == null || concepto.trim().isEmpty()) {
            return listarTodas();
        }

        String conceptoLower = concepto.toLowerCase();
        return inversionInicialRepository.findAllByOrderByFechaDesc()
                .stream()
                .filter(inv -> inv.getConcepto().toLowerCase().contains(conceptoLower))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene inversiones iniciales por rango de fechas
     */
    @Transactional(readOnly = true)
    public List<InversionInicialDTO> obtenerPorRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        log.debug("Obteniendo inversiones iniciales entre {} y {}", fechaInicio, fechaFin);

        return inversionInicialRepository.findByFechaBetween(fechaInicio, fechaFin)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el monto total de todas las inversiones iniciales
     */
    @Transactional(readOnly = true)
    public BigDecimal obtenerInversionTotal() {
        log.debug("Calculando inversión total");

        BigDecimal total = inversionInicialRepository.calcularInversionTotal();
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Obtiene el monto total de inversiones por categoría
     */
    @Transactional(readOnly = true)
    public BigDecimal obtenerInversionPorCategoria(String categoria) {
        log.debug("Calculando inversión total por categoría: {}", categoria);

        // Validar categoría
        CategoriaInversion categoriaEnum = validarCategoria(categoria);

        BigDecimal total = inversionInicialRepository.calcularInversionPorCategoria(categoriaEnum);
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Convierte una entidad InversionInicial a DTO
     */
    private InversionInicialDTO toDTO(InversionInicial entity) {
        InversionInicialDTO dto = InversionInicialDTO.builder()
                .id(entity.getId())
                .concepto(entity.getConcepto())
                .descripcion(entity.getDescripcion())
                .categoria(entity.getCategoria() != null ? entity.getCategoria().name() : null)
                .monto(entity.getMonto())
                .fecha(entity.getFecha())
                .numeroFactura(entity.getNumeroFactura())
                .formaPago(entity.getFormaPago())
                .creadoEn(entity.getCreadoEn())
                .actualizadoEn(entity.getActualizadoEn())
                .build();

        // Mapear información del proveedor si existe
        if (entity.getProveedor() != null) {
            dto.setProveedorId(entity.getProveedor().getId());
            dto.setProveedorNombre(entity.getProveedor().getNombre());
        }

        // Mapear información del activo fijo si existe
        if (entity.getActivoFijo() != null) {
            dto.setActivoFijoId(entity.getActivoFijo().getId());
            dto.setActivoFijoNombre(entity.getActivoFijo().getNombre());
        }

        return dto;
    }

    /**
     * Valida que la categoría existe en el enum CategoriaInversion
     */
    private CategoriaInversion validarCategoria(String categoria) {
        if (categoria == null || categoria.trim().isEmpty()) {
            throw new RuntimeException("La categoría es obligatoria");
        }

        try {
            return CategoriaInversion.valueOf(categoria.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Categoría inválida: " + categoria + ". Valores permitidos: " +
                    java.util.Arrays.toString(CategoriaInversion.values()));
        }
    }
}
