package com.club.management.service;

import com.club.management.dto.request.ActivoFijoRequest;
import com.club.management.dto.response.ActivoFijoDTO;
import com.club.management.entity.ActivoFijo;
import com.club.management.entity.ActivoFijo.CategoriaActivoFijo;
import com.club.management.entity.Proveedor;
import com.club.management.repository.ActivoFijoRepository;
import com.club.management.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ActivoFijoService {

    private final ActivoFijoRepository activoFijoRepository;
    private final ProveedorRepository proveedorRepository;

    /**
     * Crea un nuevo activo fijo
     */
    public ActivoFijoDTO crearActivoFijo(ActivoFijoRequest request) {
        log.info("Creando nuevo activo fijo: {}", request.getNombre());

        // Validar categoría
        CategoriaActivoFijo categoria = validarCategoria(request.getCategoria());

        // Validar proveedor si se especifica
        Proveedor proveedor = null;
        if (request.getProveedorId() != null) {
            proveedor = proveedorRepository.findById(request.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + request.getProveedorId()));
        }

        // Construir entidad
        ActivoFijo activoFijo = ActivoFijo.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .categoria(categoria)
                .valorInicial(request.getValorInicial())
                .fechaAdquisicion(request.getFechaAdquisicion())
                .vidaUtilAnios(request.getVidaUtilAnios())
                .valorResidual(request.getValorResidual() != null ? request.getValorResidual() : BigDecimal.ZERO)
                .proveedor(proveedor)
                .numeroFactura(request.getNumeroFactura())
                .ubicacion(request.getUbicacion())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .notas(request.getNotas())
                .build();

        // Guardar (el trigger de BD calculará los campos de amortización)
        ActivoFijo saved = activoFijoRepository.save(activoFijo);

        log.info("Activo fijo creado exitosamente con id: {}", saved.getId());
        return toDTO(saved);
    }

    /**
     * Actualiza un activo fijo existente
     */
    public ActivoFijoDTO actualizarActivoFijo(Long id, ActivoFijoRequest request) {
        log.info("Actualizando activo fijo con id: {}", id);

        // Buscar activo existente
        ActivoFijo activoFijo = activoFijoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activo fijo no encontrado con id: " + id));

        // Validar categoría
        CategoriaActivoFijo categoria = validarCategoria(request.getCategoria());

        // Validar proveedor si se especifica
        Proveedor proveedor = null;
        if (request.getProveedorId() != null) {
            proveedor = proveedorRepository.findById(request.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + request.getProveedorId()));
        }

        // Actualizar campos
        activoFijo.setNombre(request.getNombre());
        activoFijo.setDescripcion(request.getDescripcion());
        activoFijo.setCategoria(categoria);
        activoFijo.setValorInicial(request.getValorInicial());
        activoFijo.setFechaAdquisicion(request.getFechaAdquisicion());
        activoFijo.setVidaUtilAnios(request.getVidaUtilAnios());
        activoFijo.setValorResidual(request.getValorResidual() != null ? request.getValorResidual() : BigDecimal.ZERO);
        activoFijo.setProveedor(proveedor);
        activoFijo.setNumeroFactura(request.getNumeroFactura());
        activoFijo.setUbicacion(request.getUbicacion());
        activoFijo.setActivo(request.getActivo() != null ? request.getActivo() : activoFijo.getActivo());
        activoFijo.setNotas(request.getNotas());

        // Guardar (el trigger de BD recalculará los campos de amortización)
        ActivoFijo updated = activoFijoRepository.save(activoFijo);

        log.info("Activo fijo actualizado exitosamente con id: {}", updated.getId());
        return toDTO(updated);
    }

    /**
     * Obtiene un activo fijo por su ID
     */
    @Transactional(readOnly = true)
    public ActivoFijoDTO obtenerPorId(Long id) {
        log.debug("Obteniendo activo fijo con id: {}", id);

        ActivoFijo activoFijo = activoFijoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activo fijo no encontrado con id: " + id));

        return toDTO(activoFijo);
    }

    /**
     * Lista todos los activos fijos ordenados por fecha de adquisición
     */
    @Transactional(readOnly = true)
    public List<ActivoFijoDTO> listarTodos() {
        log.debug("Listando todos los activos fijos");

        return activoFijoRepository.findAllByOrderByFechaAdquisicionDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lista solo los activos fijos activos ordenados por fecha de adquisición
     */
    @Transactional(readOnly = true)
    public List<ActivoFijoDTO> listarActivos() {
        log.debug("Listando activos fijos activos");

        return activoFijoRepository.findByActivoTrueOrderByFechaAdquisicionDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lista activos fijos por categoría
     */
    @Transactional(readOnly = true)
    public List<ActivoFijoDTO> listarPorCategoria(String categoria) {
        log.debug("Listando activos fijos por categoría: {}", categoria);

        // Validar categoría
        CategoriaActivoFijo categoriaEnum = validarCategoria(categoria);

        return activoFijoRepository.findByCategoria(categoriaEnum)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Elimina (desactiva) un activo fijo
     */
    public void eliminar(Long id) {
        log.info("Eliminando activo fijo con id: {}", id);

        ActivoFijo activoFijo = activoFijoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activo fijo no encontrado con id: " + id));

        activoFijo.setActivo(false);
        activoFijoRepository.save(activoFijo);

        log.info("Activo fijo eliminado (desactivado) exitosamente con id: {}", id);
    }

    /**
     * Recalcula la amortización de un activo fijo específico
     * Fuerza el recálculo ejecutando el trigger de BD
     */
    public ActivoFijoDTO recalcularAmortizacion(Long id) {
        log.info("Recalculando amortización para activo fijo con id: {}", id);

        ActivoFijo activoFijo = activoFijoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activo fijo no encontrado con id: " + id));

        // Forzar actualización para que el trigger recalcule
        activoFijo.setActualizadoEn(java.time.LocalDateTime.now());
        ActivoFijo updated = activoFijoRepository.save(activoFijo);

        log.info("Amortización recalculada exitosamente para activo fijo con id: {}", id);
        return toDTO(updated);
    }

    /**
     * Busca activos fijos por nombre (búsqueda parcial, case insensitive)
     */
    @Transactional(readOnly = true)
    public List<ActivoFijoDTO> buscarPorNombre(String nombre) {
        log.debug("Buscando activos fijos por nombre: {}", nombre);

        if (nombre == null || nombre.trim().isEmpty()) {
            return listarTodos();
        }

        String nombreLower = nombre.toLowerCase();
        return activoFijoRepository.findAllByOrderByFechaAdquisicionDesc()
                .stream()
                .filter(af -> af.getNombre().toLowerCase().contains(nombreLower))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el valor neto total de todos los activos fijos activos
     */
    @Transactional(readOnly = true)
    public BigDecimal obtenerValorNetoTotal() {
        log.debug("Calculando valor neto total");

        BigDecimal total = activoFijoRepository.calcularValorNetoTotal();
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Obtiene el valor inicial total de todos los activos fijos activos
     */
    @Transactional(readOnly = true)
    public BigDecimal obtenerValorInicialTotal() {
        log.debug("Calculando valor inicial total");

        BigDecimal total = activoFijoRepository.calcularValorInicialTotal();
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Obtiene la amortización acumulada total de todos los activos fijos activos
     */
    @Transactional(readOnly = true)
    public BigDecimal obtenerAmortizacionAcumulada() {
        log.debug("Calculando amortización acumulada total");

        BigDecimal total = activoFijoRepository.calcularAmortizacionAcumuladaTotal();
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Obtiene los activos fijos completamente amortizados (porcentaje >= 100%)
     */
    @Transactional(readOnly = true)
    public List<ActivoFijoDTO> obtenerActivosAmortizados() {
        log.debug("Listando activos fijos completamente amortizados");

        return activoFijoRepository.findByActivoTrue()
                .stream()
                .map(this::toDTO)
                .filter(dto -> dto.getPorcentajeAmortizacion() != null && dto.getPorcentajeAmortizacion() >= 100.0)
                .collect(Collectors.toList());
    }

    /**
     * Convierte una entidad ActivoFijo a DTO
     */
    private ActivoFijoDTO toDTO(ActivoFijo entity) {
        ActivoFijoDTO dto = ActivoFijoDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .descripcion(entity.getDescripcion())
                .categoria(entity.getCategoria() != null ? entity.getCategoria().name() : null)
                .valorInicial(entity.getValorInicial())
                .fechaAdquisicion(entity.getFechaAdquisicion())
                .vidaUtilAnios(entity.getVidaUtilAnios())
                .valorResidual(entity.getValorResidual())
                .amortizacionAnual(entity.getAmortizacionAnual())
                .amortizacionMensual(entity.getAmortizacionMensual())
                .amortizacionAcumulada(entity.getAmortizacionAcumulada())
                .valorNeto(entity.getValorNeto())
                .numeroFactura(entity.getNumeroFactura())
                .ubicacion(entity.getUbicacion())
                .activo(entity.getActivo())
                .notas(entity.getNotas())
                .creadoEn(entity.getCreadoEn())
                .actualizadoEn(entity.getActualizadoEn())
                .build();

        // Mapear información del proveedor si existe
        if (entity.getProveedor() != null) {
            dto.setProveedorId(entity.getProveedor().getId());
            dto.setProveedorNombre(entity.getProveedor().getNombre());
        }

        // Calcular campos derivados
        dto.calcularCamposDerivados();

        return dto;
    }

    /**
     * Valida que la categoría existe en el enum CategoriaActivoFijo
     */
    private CategoriaActivoFijo validarCategoria(String categoria) {
        if (categoria == null || categoria.trim().isEmpty()) {
            throw new RuntimeException("La categoría es obligatoria");
        }

        try {
            return CategoriaActivoFijo.valueOf(categoria.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Categoría inválida: " + categoria + ". Valores permitidos: " +
                    java.util.Arrays.toString(CategoriaActivoFijo.values()));
        }
    }
}
