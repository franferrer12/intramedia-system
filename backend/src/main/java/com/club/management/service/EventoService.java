package com.club.management.service;

import com.club.management.dto.request.EventoRequest;
import com.club.management.dto.request.MovimientoStockFormData;
import com.club.management.dto.response.EventoDTO;
import com.club.management.entity.Evento;
import com.club.management.entity.Evento.EstadoEvento;
import com.club.management.entity.EventoProducto;
import com.club.management.repository.EventoRepository;
import com.club.management.repository.EventoProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de Eventos
 */
@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final EventoProductoRepository eventoProductoRepository;
    private final MovimientoStockService movimientoStockService;

    /**
     * Obtener todos los eventos
     */
    @Transactional(readOnly = true)
    public List<EventoDTO> getAllEventos() {
        return eventoRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener evento por ID
     */
    @Transactional(readOnly = true)
    public EventoDTO getEventoById(Long id) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado con id: " + id));
        return mapToDTO(evento);
    }

    /**
     * Crear nuevo evento
     */
    @Transactional
    public EventoDTO createEvento(EventoRequest request) {
        Evento evento = Evento.builder()
                .nombre(request.getNombre())
                .fecha(request.getFecha())
                .horaInicio(request.getHoraInicio())
                .horaFin(request.getHoraFin())
                .tipo(request.getTipo())
                .aforoEsperado(request.getAforoEsperado())
                .aforoReal(request.getAforoReal() != null ? request.getAforoReal() : 0)
                .estado(request.getEstado() != null ? request.getEstado() : EstadoEvento.PLANIFICADO)
                .artista(request.getArtista())
                .cacheArtista(request.getCacheArtista())
                .ingresosEstimados(request.getIngresosEstimados())
                .gastosEstimados(request.getGastosEstimados())
                .ingresosReales(request.getIngresosReales() != null ? request.getIngresosReales() : BigDecimal.ZERO)
                .gastosReales(request.getGastosReales() != null ? request.getGastosReales() : BigDecimal.ZERO)
                .descripcion(request.getDescripcion())
                .notas(request.getNotas())
                .build();

        Evento savedEvento = eventoRepository.save(evento);
        return mapToDTO(savedEvento);
    }

    /**
     * Actualizar evento existente
     */
    @Transactional
    public EventoDTO updateEvento(Long id, EventoRequest request) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado con id: " + id));

        EstadoEvento estadoAnterior = evento.getEstado();

        evento.setNombre(request.getNombre());
        evento.setFecha(request.getFecha());
        evento.setHoraInicio(request.getHoraInicio());
        evento.setHoraFin(request.getHoraFin());
        evento.setTipo(request.getTipo());
        evento.setAforoEsperado(request.getAforoEsperado());
        evento.setAforoReal(request.getAforoReal());
        evento.setEstado(request.getEstado());
        evento.setArtista(request.getArtista());
        evento.setCacheArtista(request.getCacheArtista());
        evento.setIngresosEstimados(request.getIngresosEstimados());
        evento.setGastosEstimados(request.getGastosEstimados());
        evento.setIngresosReales(request.getIngresosReales());
        evento.setGastosReales(request.getGastosReales());
        evento.setDescripcion(request.getDescripcion());
        evento.setNotas(request.getNotas());

        Evento updatedEvento = eventoRepository.save(evento);

        // Si el evento cambió a FINALIZADO, generar movimientos de stock automáticamente
        if (estadoAnterior != EstadoEvento.FINALIZADO && request.getEstado() == EstadoEvento.FINALIZADO) {
            generarMovimientosStock(updatedEvento);
        }

        return mapToDTO(updatedEvento);
    }

    /**
     * Eliminar evento
     */
    @Transactional
    public void deleteEvento(Long id) {
        if (!eventoRepository.existsById(id)) {
            throw new RuntimeException("Evento no encontrado con id: " + id);
        }
        eventoRepository.deleteById(id);
    }

    /**
     * Obtener eventos próximos
     */
    @Transactional(readOnly = true)
    public List<EventoDTO> getProximosEventos() {
        return eventoRepository.findEventosFuturos(LocalDate.now()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener eventos por estado
     */
    @Transactional(readOnly = true)
    public List<EventoDTO> getEventosByEstado(EstadoEvento estado) {
        return eventoRepository.findByEstado(estado).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Generar movimientos de stock cuando el evento finaliza
     */
    private void generarMovimientosStock(Evento evento) {
        List<EventoProducto> productos = eventoProductoRepository
                .findByEventoIdAndMovimientoGeneradoFalse(evento.getId());

        for (EventoProducto eventoProducto : productos) {
            BigDecimal cantidad = eventoProducto.getCantidadConsumida().compareTo(BigDecimal.ZERO) > 0
                    ? eventoProducto.getCantidadConsumida()
                    : eventoProducto.getCantidadPlanificada();

            MovimientoStockFormData movimiento = MovimientoStockFormData.builder()
                    .productoId(eventoProducto.getProducto().getId())
                    .tipoMovimiento("SALIDA")
                    .cantidad(cantidad)
                    .motivo("Consumo automático - Evento: " + evento.getNombre())
                    .eventoId(evento.getId())
                    .build();

            movimientoStockService.registrarMovimiento(movimiento);

            eventoProducto.setMovimientoGenerado(true);
            eventoProductoRepository.save(eventoProducto);
        }
    }

    /**
     * Mapear Evento a EventoDTO
     */
    private EventoDTO mapToDTO(Evento evento) {
        return EventoDTO.builder()
                .id(evento.getId())
                .nombre(evento.getNombre())
                .fecha(evento.getFecha())
                .horaInicio(evento.getHoraInicio())
                .horaFin(evento.getHoraFin())
                .tipo(evento.getTipo().name())
                .aforoEsperado(evento.getAforoEsperado())
                .aforoReal(evento.getAforoReal())
                .estado(evento.getEstado().name())
                .artista(evento.getArtista())
                .cacheArtista(evento.getCacheArtista())
                .ingresosEstimados(evento.getIngresosEstimados())
                .gastosEstimados(evento.getGastosEstimados())
                .ingresosReales(evento.getIngresosReales())
                .gastosReales(evento.getGastosReales())
                .beneficioNeto(evento.calcularBeneficio())
                .margen(evento.calcularMargen())
                .descripcion(evento.getDescripcion())
                .notas(evento.getNotas())
                .creadoEn(evento.getCreadoEn())
                .actualizadoEn(evento.getActualizadoEn())
                .build();
    }
}
