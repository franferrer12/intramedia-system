package com.club.management.service;

import com.club.management.dto.PedidoRecurrenteDTO;
import com.club.management.model.*;
import com.club.management.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PedidoRecurrenteService {

    private final PedidoRecurrenteRepository recurrenteRepository;
    private final PlantillaPedidoRepository plantillaRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final EjecucionPedidoRecurrenteRepository ejecucionRepository;

    /**
     * Obtener todos los pedidos recurrentes
     */
    @Transactional(readOnly = true)
    public List<PedidoRecurrenteDTO> getAllRecurrentes() {
        return recurrenteRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener pedidos recurrentes activos
     */
    @Transactional(readOnly = true)
    public List<PedidoRecurrenteDTO> getRecurrentesActivos() {
        return recurrenteRepository.findByActivoTrue()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener pedido recurrente por ID
     */
    @Transactional(readOnly = true)
    public PedidoRecurrenteDTO getRecurrenteById(Long id) {
        PedidoRecurrente recurrente = recurrenteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido recurrente no encontrado"));
        return mapToDTO(recurrente);
    }

    /**
     * Obtener próximas ejecuciones (próximos N días)
     */
    @Transactional(readOnly = true)
    public List<PedidoRecurrenteDTO> getProximasEjecuciones(int dias) {
        LocalDateTime desde = LocalDateTime.now();
        LocalDateTime hasta = desde.plusDays(dias);

        return recurrenteRepository.findProximasEjecuciones(desde, hasta)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crear nuevo pedido recurrente
     */
    @Transactional
    public PedidoRecurrenteDTO crearRecurrente(PedidoRecurrenteDTO dto, Long usuarioId) {
        PlantillaPedido plantilla = plantillaRepository.findById(dto.getPlantillaId())
                .orElseThrow(() -> new RuntimeException("Plantilla no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Calcular próxima ejecución
        LocalDateTime proximaEjecucion = calcularProximaEjecucion(
                dto.getFrecuencia(),
                dto.getDiaEjecucion(),
                dto.getDiasEjecucion(),
                dto.getHoraEjecucion() != null ? dto.getHoraEjecucion() : LocalTime.of(9, 0)
        );

        PedidoRecurrente recurrente = PedidoRecurrente.builder()
                .plantilla(plantilla)
                .frecuencia(PedidoRecurrente.Frecuencia.valueOf(dto.getFrecuencia()))
                .diaEjecucion(dto.getDiaEjecucion())
                .diasEjecucion(dto.getDiasEjecucion())
                .horaEjecucion(dto.getHoraEjecucion() != null ? dto.getHoraEjecucion() : LocalTime.of(9, 0))
                .proximaEjecucion(proximaEjecucion)
                .activo(true)
                .notificarAntesHoras(dto.getNotificarAntesHoras() != null ? dto.getNotificarAntesHoras() : 24)
                .emailsNotificacion(dto.getEmailsNotificacion())
                .creadoPor(usuario)
                .build();

        PedidoRecurrente saved = recurrenteRepository.save(recurrente);
        return mapToDTO(saved);
    }

    /**
     * Actualizar pedido recurrente
     */
    @Transactional
    public PedidoRecurrenteDTO actualizarRecurrente(Long id, PedidoRecurrenteDTO dto) {
        PedidoRecurrente recurrente = recurrenteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido recurrente no encontrado"));

        boolean recalcularProxima = false;

        if (dto.getFrecuencia() != null && !dto.getFrecuencia().equals(recurrente.getFrecuencia().name())) {
            recurrente.setFrecuencia(PedidoRecurrente.Frecuencia.valueOf(dto.getFrecuencia()));
            recalcularProxima = true;
        }

        if (dto.getDiaEjecucion() != null && !dto.getDiaEjecucion().equals(recurrente.getDiaEjecucion())) {
            recurrente.setDiaEjecucion(dto.getDiaEjecucion());
            recalcularProxima = true;
        }

        if (dto.getHoraEjecucion() != null && !dto.getHoraEjecucion().equals(recurrente.getHoraEjecucion())) {
            recurrente.setHoraEjecucion(dto.getHoraEjecucion());
            recalcularProxima = true;
        }

        if (dto.getNotificarAntesHoras() != null) {
            recurrente.setNotificarAntesHoras(dto.getNotificarAntesHoras());
        }

        if (dto.getEmailsNotificacion() != null) {
            recurrente.setEmailsNotificacion(dto.getEmailsNotificacion());
        }

        // Recalcular próxima ejecución si cambió la configuración
        if (recalcularProxima) {
            LocalDateTime nuevaProxima = calcularProximaEjecucion(
                    recurrente.getFrecuencia().name(),
                    recurrente.getDiaEjecucion(),
                    recurrente.getDiasEjecucion(),
                    recurrente.getHoraEjecucion()
            );
            recurrente.setProximaEjecucion(nuevaProxima);
        }

        PedidoRecurrente updated = recurrenteRepository.save(recurrente);
        return mapToDTO(updated);
    }

    /**
     * Activar/Desactivar pedido recurrente
     */
    @Transactional
    public PedidoRecurrenteDTO toggleActivo(Long id) {
        PedidoRecurrente recurrente = recurrenteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido recurrente no encontrado"));

        recurrente.setActivo(!recurrente.getActivo());
        PedidoRecurrente updated = recurrenteRepository.save(recurrente);
        return mapToDTO(updated);
    }

    /**
     * Eliminar pedido recurrente
     */
    @Transactional
    public void eliminarRecurrente(Long id) {
        if (!recurrenteRepository.existsById(id)) {
            throw new RuntimeException("Pedido recurrente no encontrado");
        }
        recurrenteRepository.deleteById(id);
    }

    /**
     * Ejecutar pedidos recurrentes pendientes (llamado por scheduler)
     */
    @Transactional
    public List<Long> ejecutarPedidosPendientes() {
        List<Long> pedidosGenerados = new ArrayList<>();
        List<PedidoRecurrente> pendientes = recurrenteRepository.findPendientesDeEjecucion(LocalDateTime.now());

        log.info("Encontrados {} pedidos recurrentes pendientes de ejecución", pendientes.size());

        for (PedidoRecurrente recurrente : pendientes) {
            try {
                // Generar pedido desde la plantilla
                Long pedidoId = generarPedidoDesdePlantilla(recurrente.getPlantilla());

                // Registrar ejecución exitosa
                Pedido pedido = pedidoRepository.findById(pedidoId).orElse(null);
                EjecucionPedidoRecurrente ejecucion = EjecucionPedidoRecurrente.crearExitoso(recurrente, pedido);
                ejecucionRepository.save(ejecucion);

                // Actualizar última ejecución y calcular próxima
                recurrente.setUltimaEjecucion(LocalDateTime.now());
                LocalDateTime nuevaProxima = calcularProximaEjecucion(
                        recurrente.getFrecuencia().name(),
                        recurrente.getDiaEjecucion(),
                        recurrente.getDiasEjecucion(),
                        recurrente.getHoraEjecucion()
                );
                recurrente.setProximaEjecucion(nuevaProxima);
                recurrenteRepository.save(recurrente);

                pedidosGenerados.add(pedidoId);
                log.info("Pedido recurrente {} ejecutado exitosamente. Pedido generado: {}", recurrente.getId(), pedidoId);

            } catch (Exception e) {
                log.error("Error al ejecutar pedido recurrente {}: {}", recurrente.getId(), e.getMessage(), e);

                // Registrar ejecución fallida
                EjecucionPedidoRecurrente ejecucion = EjecucionPedidoRecurrente.crearFallido(
                        recurrente,
                        e.getMessage()
                );
                ejecucionRepository.save(ejecucion);
            }
        }

        return pedidosGenerados;
    }

    /**
     * Obtener estadísticas de pedidos recurrentes
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getEstadisticas() {
        Map<String, Object> stats = new HashMap<>();

        long total = recurrenteRepository.count();
        long activos = recurrenteRepository.countByActivoTrue();

        stats.put("totalRecurrentes", total);
        stats.put("recurrentesActivos", activos);
        stats.put("recurrentesInactivos", total - activos);

        // Próximas ejecuciones (próximos 7 días)
        List<PedidoRecurrente> proximas = recurrenteRepository.findProximasEjecuciones(
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(7)
        );
        stats.put("proximasEjecuciones7Dias", proximas.size());

        return stats;
    }

    // Helper methods

    private Long generarPedidoDesdePlantilla(PlantillaPedido plantilla) {
        // Crear nuevo pedido basado en la plantilla
        Pedido pedido = new Pedido();
        pedido.setProveedor(plantilla.getProveedor());
        pedido.setFechaPedido(LocalDateTime.now());
        pedido.setEstado(Pedido.EstadoPedido.BORRADOR);
        pedido.setObservaciones(plantilla.getObservaciones());

        // Convertir detalles JSON a entidades DetallePedido
        List<DetallePedido> detalles = convertirJsonADetalles(plantilla.getDetalles(), pedido);
        pedido.setDetalles(detalles);

        // Calcular total
        BigDecimal total = detalles.stream()
                .map(d -> d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        pedido.setTotal(total);

        Pedido saved = pedidoRepository.save(pedido);
        return saved.getId();
    }

    private List<DetallePedido> convertirJsonADetalles(JsonNode detallesJson, Pedido pedido) {
        List<DetallePedido> detalles = new ArrayList<>();

        if (detallesJson != null && detallesJson.isArray()) {
            for (JsonNode item : detallesJson) {
                Long productoId = item.get("productoId").asLong();
                Integer cantidad = item.get("cantidad").asInt();
                BigDecimal precioUnitario = new BigDecimal(item.get("precioUnitario").asText());

                Producto producto = productoRepository.findById(productoId)
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));

                DetallePedido detalle = new DetallePedido();
                detalle.setPedido(pedido);
                detalle.setProducto(producto);
                detalle.setCantidad(cantidad);
                detalle.setPrecioUnitario(precioUnitario);

                detalles.add(detalle);
            }
        }

        return detalles;
    }

    private LocalDateTime calcularProximaEjecucion(
            String frecuencia,
            Integer diaEjecucion,
            String diasEjecucion,
            LocalTime horaEjecucion
    ) {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime proxima;

        switch (frecuencia) {
            case "SEMANAL":
                // Próximo día de la semana especificado (1=Lunes, 7=Domingo)
                int diaActual = ahora.getDayOfWeek().getValue();
                int diasHasta = (diaEjecucion - diaActual + 7) % 7;
                if (diasHasta == 0) diasHasta = 7; // Si es hoy, programar para la próxima semana
                proxima = ahora.plusDays(diasHasta).toLocalDate().atTime(horaEjecucion);
                break;

            case "QUINCENAL":
                // Días 1 y 15 de cada mes
                int diaDelMes = ahora.getDayOfMonth();
                if (diaDelMes < 15) {
                    proxima = ahora.toLocalDate().withDayOfMonth(15).atTime(horaEjecucion);
                } else {
                    proxima = ahora.plusMonths(1).toLocalDate().withDayOfMonth(1).atTime(horaEjecucion);
                }
                break;

            case "MENSUAL":
                // Día específico del mes
                proxima = ahora.toLocalDate().withDayOfMonth(diaEjecucion).atTime(horaEjecucion);
                if (proxima.isBefore(ahora) || proxima.isEqual(ahora)) {
                    proxima = proxima.plusMonths(1);
                }
                break;

            case "TRIMESTRAL":
                // Cada 3 meses en el día especificado
                proxima = ahora.toLocalDate().withDayOfMonth(diaEjecucion).atTime(horaEjecucion);
                if (proxima.isBefore(ahora) || proxima.isEqual(ahora)) {
                    proxima = proxima.plusMonths(3);
                }
                break;

            default:
                throw new RuntimeException("Frecuencia no válida: " + frecuencia);
        }

        return proxima;
    }

    private PedidoRecurrenteDTO mapToDTO(PedidoRecurrente recurrente) {
        return PedidoRecurrenteDTO.builder()
                .id(recurrente.getId())
                .plantillaId(recurrente.getPlantilla().getId())
                .plantillaNombre(recurrente.getPlantilla().getNombre())
                .proveedorNombre(recurrente.getPlantilla().getProveedor().getNombre())
                .frecuencia(recurrente.getFrecuencia().name())
                .diaEjecucion(recurrente.getDiaEjecucion())
                .diasEjecucion(recurrente.getDiasEjecucion())
                .horaEjecucion(recurrente.getHoraEjecucion())
                .proximaEjecucion(recurrente.getProximaEjecucion())
                .ultimaEjecucion(recurrente.getUltimaEjecucion())
                .activo(recurrente.getActivo())
                .notificarAntesHoras(recurrente.getNotificarAntesHoras())
                .emailsNotificacion(recurrente.getEmailsNotificacion())
                .descripcionFrecuencia(recurrente.getDescripcionFrecuencia())
                .creadoPorId(recurrente.getCreadoPor().getId())
                .creadoPorNombre(recurrente.getCreadoPor().getUsername())
                .fechaCreacion(recurrente.getFechaCreacion())
                .build();
    }
}
