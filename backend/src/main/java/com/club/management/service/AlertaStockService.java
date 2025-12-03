package com.club.management.service;

import com.club.management.entity.AlertaStock;
import com.club.management.entity.Producto;
import com.club.management.repository.AlertaStockRepository;
import com.club.management.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertaStockService {

    private final AlertaStockRepository alertaRepository;
    private final ProductoRepository productoRepository;

    /**
     * Verifica el stock de todos los productos y genera alertas automáticamente
     * Se ejecuta cada hora
     */
    @Scheduled(cron = "0 0 * * * *") // Cada hora
    @Transactional
    public void verificarStockYGenerarAlertas() {
        log.info("Iniciando verificación automática de stock...");

        List<Producto> productosActivos = productoRepository.findByActivoTrue();
        int alertasCreadas = 0;

        for (Producto producto : productosActivos) {
            boolean alertaGenerada = procesarAlertas(producto);
            if (alertaGenerada) {
                alertasCreadas++;
            }
        }

        log.info("Verificación completada. {} alertas generadas.", alertasCreadas);
    }

    /**
     * Procesa las alertas para un producto específico
     */
    @Transactional
    public boolean procesarAlertas(Producto producto) {
        boolean alertaGenerada = false;

        // Verificar si el stock está en 0
        if (producto.getStockActual().compareTo(java.math.BigDecimal.ZERO) == 0) {
            alertaGenerada = crearAlertaSiNoExiste(
                    producto,
                    "SIN_STOCK",
                    "CRITICO",
                    String.format("⚠️ CRÍTICO: El producto '%s' no tiene stock disponible", producto.getNombre())
            );
        }
        // Verificar si el stock está por debajo del mínimo
        else if (producto.getStockActual().compareTo(producto.getStockMinimo()) < 0) {
            alertaGenerada = crearAlertaSiNoExiste(
                    producto,
                    "STOCK_BAJO",
                    "ALTO",
                    String.format("⚠️ Stock bajo: El producto '%s' tiene %s %s (mínimo: %s %s)",
                            producto.getNombre(),
                            producto.getStockActual(),
                            producto.getUnidadMedida(),
                            producto.getStockMinimo(),
                            producto.getUnidadMedida())
            );
        }
        // Si el stock está OK, desactivar alertas existentes
        else {
            desactivarAlertasDeProducto(producto.getId());
        }

        return alertaGenerada;
    }

    /**
     * Crea una alerta solo si no existe una activa del mismo tipo para el producto
     */
    private boolean crearAlertaSiNoExiste(Producto producto, String tipoAlerta, String nivel, String mensaje) {
        // Verificar si ya existe una alerta activa del mismo tipo para este producto
        List<AlertaStock> alertasActivas = alertaRepository
                .findByProductoIdAndActivaTrueOrderByFechaAlertaDesc(producto.getId());

        boolean yaExiste = alertasActivas.stream()
                .anyMatch(a -> a.getTipoAlerta().equals(tipoAlerta));

        if (!yaExiste) {
            AlertaStock alerta = new AlertaStock();
            alerta.setProducto(producto);
            alerta.setTipoAlerta(tipoAlerta);
            alerta.setNivel(nivel);
            alerta.setMensaje(mensaje);
            alerta.setFechaAlerta(LocalDateTime.now());
            alerta.setLeida(false);
            alerta.setActiva(true);

            alertaRepository.save(alerta);
            log.info("Alerta creada para producto {}: {} - {}", producto.getCodigo(), nivel, tipoAlerta);
            return true;
        }

        return false;
    }

    /**
     * Desactiva todas las alertas activas de un producto
     */
    @Transactional
    public void desactivarAlertasDeProducto(Long productoId) {
        List<AlertaStock> alertasActivas = alertaRepository
                .findByProductoIdAndActivaTrueOrderByFechaAlertaDesc(productoId);

        for (AlertaStock alerta : alertasActivas) {
            alerta.setActiva(false);
            alertaRepository.save(alerta);
        }
    }

    /**
     * Obtiene todas las alertas activas
     */
    @Transactional(readOnly = true)
    public List<AlertaStock> getAlertasActivas() {
        return alertaRepository.findByActivaTrueOrderByFechaAlertaDesc();
    }

    /**
     * Obtiene todas las alertas no leídas
     */
    @Transactional(readOnly = true)
    public List<AlertaStock> getAlertasNoLeidas() {
        return alertaRepository.findByLeidaFalseAndActivaTrueOrderByFechaAlertaDesc();
    }

    /**
     * Obtiene el conteo de alertas no leídas
     */
    @Transactional(readOnly = true)
    public Long getConteoAlertasNoLeidas() {
        return alertaRepository.countByLeidaFalseAndActivaTrue();
    }

    /**
     * Marca una alerta como leída
     */
    @Transactional
    public void marcarComoLeida(Long alertaId) {
        AlertaStock alerta = alertaRepository.findById(alertaId)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada"));

        alerta.setLeida(true);
        alerta.setFechaLectura(LocalDateTime.now());
        alertaRepository.save(alerta);
    }

    /**
     * Marca todas las alertas como leídas
     */
    @Transactional
    public void marcarTodasComoLeidas() {
        List<AlertaStock> alertasNoLeidas = alertaRepository
                .findByLeidaFalseAndActivaTrueOrderByFechaAlertaDesc();

        LocalDateTime ahora = LocalDateTime.now();
        for (AlertaStock alerta : alertasNoLeidas) {
            alerta.setLeida(true);
            alerta.setFechaLectura(ahora);
            alertaRepository.save(alerta);
        }
    }

    /**
     * Desactiva una alerta específica
     */
    @Transactional
    public void desactivarAlerta(Long alertaId) {
        AlertaStock alerta = alertaRepository.findById(alertaId)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada"));

        alerta.setActiva(false);
        alertaRepository.save(alerta);
    }

    /**
     * Fuerza una verificación inmediata del stock (útil para testing o triggers manuales)
     */
    @Transactional
    public void forzarVerificacionStock() {
        log.info("Forzando verificación manual de stock...");
        verificarStockYGenerarAlertas();
    }
}
