package com.club.management.service;

import com.club.management.dto.request.TransaccionRequest;
import com.club.management.dto.response.TransaccionDTO;
import com.club.management.entity.*;
import com.club.management.entity.Transaccion.TipoTransaccion;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;
    private final CategoriaTransaccionRepository categoriaTransaccionRepository;
    private final EventoRepository eventoRepository;
    private final ProveedorRepository proveedorRepository;

    @Transactional(readOnly = true)
    public List<TransaccionDTO> findAll() {
        return transaccionRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransaccionDTO> findByTipo(String tipo) {
        TipoTransaccion tipoEnum = TipoTransaccion.valueOf(tipo);
        return transaccionRepository.findByTipo(tipoEnum).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransaccionDTO> findByEventoId(Long eventoId) {
        return transaccionRepository.findByEventoId(eventoId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransaccionDTO> findByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin) {
        return transaccionRepository.findByFechaBetween(fechaInicio, fechaFin).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransaccionDTO findById(Long id) {
        Transaccion transaccion = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada"));
        return mapToDTO(transaccion);
    }

    @Transactional
    public TransaccionDTO create(TransaccionRequest request) {
        Transaccion transaccion = new Transaccion();
        mapRequestToEntity(request, transaccion);
        transaccion = transaccionRepository.save(transaccion);
        return mapToDTO(transaccion);
    }

    @Transactional
    public TransaccionDTO update(Long id, TransaccionRequest request) {
        Transaccion transaccion = transaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transacción no encontrada"));
        mapRequestToEntity(request, transaccion);
        transaccion = transaccionRepository.save(transaccion);
        return mapToDTO(transaccion);
    }

    @Transactional
    public void delete(Long id) {
        transaccionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public BigDecimal getSumByTipoAndFecha(String tipo, LocalDate fechaInicio, LocalDate fechaFin) {
        TipoTransaccion tipoEnum = TipoTransaccion.valueOf(tipo);
        BigDecimal sum = transaccionRepository.sumByTipoAndFechaBetween(tipoEnum, fechaInicio, fechaFin);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getSumByEventoIdAndTipo(Long eventoId, String tipo) {
        TipoTransaccion tipoEnum = TipoTransaccion.valueOf(tipo);
        BigDecimal sum = transaccionRepository.sumByEventoIdAndTipo(eventoId, tipoEnum);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    private void mapRequestToEntity(TransaccionRequest request, Transaccion transaccion) {
        transaccion.setTipo(request.getTipo());
        transaccion.setFecha(request.getFecha());
        transaccion.setConcepto(request.getConcepto());
        transaccion.setDescripcion(request.getDescripcion());
        transaccion.setMonto(request.getMonto());
        transaccion.setMetodoPago(request.getMetodoPago());
        transaccion.setReferencia(request.getReferencia());
        transaccion.setNotas(request.getNotas());

        // Cargar categoría
        CategoriaTransaccion categoria = categoriaTransaccionRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        transaccion.setCategoria(categoria);

        // Cargar evento si existe
        if (request.getEventoId() != null) {
            Evento evento = eventoRepository.findById(request.getEventoId())
                    .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
            transaccion.setEvento(evento);
        } else {
            transaccion.setEvento(null);
        }

        // Cargar proveedor si existe
        if (request.getProveedorId() != null) {
            Proveedor proveedor = proveedorRepository.findById(request.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
            transaccion.setProveedor(proveedor);
        } else {
            transaccion.setProveedor(null);
        }
    }

    private TransaccionDTO mapToDTO(Transaccion transaccion) {
        TransaccionDTO dto = new TransaccionDTO();
        dto.setId(transaccion.getId());
        dto.setTipo(transaccion.getTipo().name());
        dto.setCategoriaId(transaccion.getCategoria().getId());
        dto.setCategoriaNombre(transaccion.getCategoria().getNombre());

        if (transaccion.getEvento() != null) {
            dto.setEventoId(transaccion.getEvento().getId());
            dto.setEventoNombre(transaccion.getEvento().getNombre());
        }

        dto.setFecha(transaccion.getFecha());
        dto.setConcepto(transaccion.getConcepto());
        dto.setDescripcion(transaccion.getDescripcion());
        dto.setMonto(transaccion.getMonto());
        dto.setMetodoPago(transaccion.getMetodoPago());
        dto.setReferencia(transaccion.getReferencia());

        if (transaccion.getProveedor() != null) {
            dto.setProveedorId(transaccion.getProveedor().getId());
            dto.setProveedorNombre(transaccion.getProveedor().getNombre());
        }

        dto.setNotas(transaccion.getNotas());
        dto.setCreadoEn(transaccion.getCreadoEn());
        dto.setActualizadoEn(transaccion.getActualizadoEn());

        return dto;
    }
}
