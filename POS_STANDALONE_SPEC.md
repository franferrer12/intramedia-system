# 🖥️ Terminal POS Standalone - Especificación Técnica

**Proyecto:** Club Management System
**Módulo:** POS Standalone
**Versión:** 1.0
**Fecha:** 12 Octubre 2025

---

## 🎯 Objetivo

Crear una **aplicación POS independiente optimizada para tablets y PCs táctiles** que funcione como terminal de venta autónomo, conectándose automáticamente al backoffice sin necesidad de navegar por el sistema completo.

### Problemas que Resuelve
1. ❌ Navegación compleja innecesaria para personal de barra/caja
2. ❌ Interfaz no optimizada para pantallas táctiles
3. ❌ Falta de modo offline para pérdidas de conexión
4. ❌ Sin configuración específica por terminal/ubicación
5. ❌ Login complejo (username + password) para uso rápido

### Soluciones Propuestas
1. ✅ **URL dedicada** - `/pos-terminal/standalone`
2. ✅ **Layout a pantalla completa** - Sin sidebar ni navegación
3. ✅ **Modo offline con PWA** - Service Workers + IndexedDB
4. ✅ **Configuración por dispositivo** - Cada terminal tiene su setup
5. ✅ **Login rápido** - PIN de 4 dígitos o biométrico

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────┐
│               BACKOFFICE (Sistema Principal)          │
│  - Gestión completa de datos                         │
│  - Configuración de dispositivos POS                  │
│  - Reportes y analytics                               │
│  - Administración de usuarios                         │
└──────────────────────────────────────────────────────┘
                          ↕
                    REST API + JWT
                          ↕
┌──────────────────────────────────────────────────────┐
│           TERMINAL POS STANDALONE (PWA)               │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  Frontend (React PWA)                        │    │
│  │  - /pos-terminal/standalone                 │    │
│  │  - Service Worker (offline support)         │    │
│  │  - IndexedDB (local storage)                │    │
│  │  - Cache de productos                       │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  Sincronización Automática                   │    │
│  │  - Cola de transacciones pendientes         │    │
│  │  - Retry con backoff exponencial            │    │
│  │  - Resolución de conflictos                 │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
                          ↕
          ┌───────────────┴───────────────┐
          ↓                               ↓
    [Impresora Térmica]           [Lector Código Barras]
    [Cajón de Dinero]             [Pantalla Cliente]
```

---

## 📊 Base de Datos

### Migración V021: Dispositivos POS

```sql
-- ============================================
-- MIGRACIÓN V021: Sistema de Dispositivos POS
-- Fecha: 12 Octubre 2025
-- Descripción: Tabla para gestionar terminales POS independientes
-- ============================================

-- Tabla principal de dispositivos
CREATE TABLE dispositivos_pos (
    id BIGSERIAL PRIMARY KEY,

    -- Identificación
    uuid VARCHAR(36) NOT NULL UNIQUE, -- UUID generado automáticamente
    nombre VARCHAR(100) NOT NULL, -- "Caja 1", "Barra Principal"
    descripcion TEXT,

    -- Tipo y ubicación
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CAJA', 'BARRA', 'MOVIL')),
    ubicacion VARCHAR(100), -- "Entrada", "Barra VIP", "Terraza"

    -- Configuración
    empleado_asignado_id BIGINT REFERENCES empleados(id) ON DELETE SET NULL,
    pin_rapido VARCHAR(6) NOT NULL, -- PIN de 4-6 dígitos
    categorias_predeterminadas TEXT[], -- Array de categorías a mostrar

    -- Hardware
    config_impresora JSONB, -- {tipo: 'termica', ip: '192.168.1.100', modelo: 'EPSON TM-T20'}
    tiene_lector_barras BOOLEAN DEFAULT false,
    tiene_cajon_dinero BOOLEAN DEFAULT false,
    tiene_pantalla_cliente BOOLEAN DEFAULT false,

    -- Permisos
    permisos JSONB, -- {puede_descuentos: false, puede_cancelar: false, max_descuento: 10}

    -- Estado
    activo BOOLEAN DEFAULT true,
    modo_offline_habilitado BOOLEAN DEFAULT true,

    -- Tracking
    ultima_conexion TIMESTAMP,
    ultima_sincronizacion TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES usuarios(id),

    -- Constraints
    CONSTRAINT pin_valido CHECK (LENGTH(pin_rapido) BETWEEN 4 AND 6)
);

-- Índices para performance
CREATE INDEX idx_dispositivos_pos_tipo ON dispositivos_pos(tipo);
CREATE INDEX idx_dispositivos_pos_activo ON dispositivos_pos(activo);
CREATE INDEX idx_dispositivos_pos_empleado ON dispositivos_pos(empleado_asignado_id);
CREATE INDEX idx_dispositivos_pos_uuid ON dispositivos_pos(uuid);
CREATE INDEX idx_dispositivos_pos_ultima_conexion ON dispositivos_pos(ultima_conexion DESC);

-- Tabla de ventas pendientes (modo offline)
CREATE TABLE ventas_pendientes_sync (
    id BIGSERIAL PRIMARY KEY,

    -- Relaciones
    dispositivo_id BIGINT NOT NULL REFERENCES dispositivos_pos(id) ON DELETE CASCADE,
    sesion_caja_id BIGINT REFERENCES sesiones_venta(id) ON DELETE SET NULL,

    -- Datos de la venta
    datos_venta JSONB NOT NULL, -- JSON completo de VentaRequest
    uuid_venta VARCHAR(36) NOT NULL UNIQUE, -- Para evitar duplicados

    -- Estado de sincronización
    sincronizada BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_sincronizacion TIMESTAMP,

    -- Retry logic
    intentos_sincronizacion INT DEFAULT 0,
    ultimo_intento TIMESTAMP,
    proximo_intento TIMESTAMP,
    error_sincronizacion TEXT,

    -- Resultado
    venta_id BIGINT, -- ID de la venta creada tras sincronizar

    -- Constraints
    CONSTRAINT max_intentos CHECK (intentos_sincronizacion <= 10)
);

-- Índices
CREATE INDEX idx_ventas_pendientes_dispositivo ON ventas_pendientes_sync(dispositivo_id);
CREATE INDEX idx_ventas_pendientes_sincronizada ON ventas_pendientes_sync(sincronizada);
CREATE INDEX idx_ventas_pendientes_proximo_intento ON ventas_pendientes_sync(proximo_intento);
CREATE INDEX idx_ventas_pendientes_uuid ON ventas_pendientes_sync(uuid_venta);

-- Tabla de logs de actividad por dispositivo
CREATE TABLE dispositivos_pos_logs (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id BIGINT NOT NULL REFERENCES dispositivos_pos(id) ON DELETE CASCADE,

    -- Evento
    tipo_evento VARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'VENTA', 'ERROR', 'SINCRONIZACION'
    descripcion TEXT,
    metadata JSONB, -- Datos adicionales del evento

    -- Contexto
    empleado_id BIGINT REFERENCES empleados(id),
    ip_address VARCHAR(45),

    -- Timestamp
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_dispositivos_logs_dispositivo ON dispositivos_pos_logs(dispositivo_id);
CREATE INDEX idx_dispositivos_logs_fecha ON dispositivos_pos_logs(fecha DESC);
CREATE INDEX idx_dispositivos_logs_tipo ON dispositivos_pos_logs(tipo_evento);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_dispositivos_pos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_dispositivos_pos_updated_at
BEFORE UPDATE ON dispositivos_pos
FOR EACH ROW
EXECUTE FUNCTION update_dispositivos_pos_updated_at();

-- Función para registrar log automáticamente
CREATE OR REPLACE FUNCTION log_dispositivo_actividad()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO dispositivos_pos_logs (dispositivo_id, tipo_evento, descripcion, metadata)
    VALUES (
        NEW.id,
        'ACTUALIZACION',
        'Dispositivo actualizado',
        jsonb_build_object(
            'cambios', to_jsonb(NEW) - to_jsonb(OLD),
            'anterior', to_jsonb(OLD)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging
CREATE TRIGGER trigger_dispositivos_pos_log
AFTER UPDATE ON dispositivos_pos
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION log_dispositivo_actividad();

-- Seed de datos de ejemplo (comentado, descomentar para testing)
/*
INSERT INTO dispositivos_pos (uuid, nombre, tipo, ubicacion, pin_rapido, empleado_asignado_id, categorias_predeterminadas)
VALUES
    (gen_random_uuid()::text, 'Caja Principal', 'CAJA', 'Entrada', '1234', 1, ARRAY['BEBIDAS', 'SNACKS']),
    (gen_random_uuid()::text, 'Barra VIP', 'BARRA', 'Zona VIP', '5678', 2, ARRAY['BEBIDAS_PREMIUM', 'COCKTAILS']),
    (gen_random_uuid()::text, 'Caja Móvil 1', 'MOVIL', 'Terraza', '9999', NULL, ARRAY['BEBIDAS', 'HELADOS']);
*/

COMMENT ON TABLE dispositivos_pos IS 'Terminales POS registrados en el sistema';
COMMENT ON COLUMN dispositivos_pos.uuid IS 'Identificador único del dispositivo generado automáticamente';
COMMENT ON COLUMN dispositivos_pos.pin_rapido IS 'PIN de 4-6 dígitos para login rápido en el terminal';
COMMENT ON COLUMN dispositivos_pos.categorias_predeterminadas IS 'Categorías de productos que se mostrarán en este terminal';
COMMENT ON COLUMN dispositivos_pos.config_impresora IS 'Configuración de impresora térmica en formato JSON';

COMMENT ON TABLE ventas_pendientes_sync IS 'Cola de ventas realizadas offline pendientes de sincronización';
COMMENT ON COLUMN ventas_pendientes_sync.uuid_venta IS 'UUID único para evitar duplicados al sincronizar';
COMMENT ON COLUMN ventas_pendientes_sync.intentos_sincronizacion IS 'Número de intentos de sincronización (máximo 10)';

COMMENT ON TABLE dispositivos_pos_logs IS 'Registro de auditoría de actividad por dispositivo POS';
```

---

## 🔌 Backend API

### DispositivoPOSController.java

```java
package com.club.management.controller;

import com.club.management.dto.*;
import com.club.management.service.DispositivoPOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/dispositivos-pos")
@RequiredArgsConstructor
public class DispositivoPOSController {

    private final DispositivoPOSService dispositivoPOSService;

    // ============================================
    // GESTIÓN DE DISPOSITIVOS (Admin)
    // ============================================

    @PostMapping("/registrar")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'GERENTE')")
    public ResponseEntity<DispositivoPOSDTO> registrarDispositivo(
            @Valid @RequestBody DispositivoPOSRequest request) {
        DispositivoPOSDTO dispositivo = dispositivoPOSService.registrar(request);
        return ResponseEntity.ok(dispositivo);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'GERENTE')")
    public ResponseEntity<List<DispositivoPOSDTO>> listarTodos() {
        return ResponseEntity.ok(dispositivoPOSService.listarTodos());
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'GERENTE', 'ENCARGADO')")
    public ResponseEntity<List<DispositivoPOSDTO>> listarActivos() {
        return ResponseEntity.ok(dispositivoPOSService.listarActivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DispositivoPOSDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'GERENTE')")
    public ResponseEntity<DispositivoPOSDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody DispositivoPOSRequest request) {
        return ResponseEntity.ok(dispositivoPOSService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        dispositivoPOSService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================
    // AUTENTICACIÓN DE DISPOSITIVOS
    // ============================================

    @PostMapping("/autenticar")
    public ResponseEntity<AuthDispositivoDTO> autenticarConPIN(
            @RequestParam String uuid,
            @RequestParam String pin) {
        AuthDispositivoDTO auth = dispositivoPOSService.autenticarConPIN(uuid, pin);
        return ResponseEntity.ok(auth);
    }

    @GetMapping("/{id}/configuracion")
    public ResponseEntity<ConfiguracionPOSDTO> obtenerConfiguracion(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerConfiguracion(id));
    }

    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Void> registrarHeartbeat(@PathVariable Long id) {
        dispositivoPOSService.registrarHeartbeat(id);
        return ResponseEntity.ok().build();
    }

    // ============================================
    // SINCRONIZACIÓN OFFLINE
    // ============================================

    @PostMapping("/ventas-offline/sincronizar")
    public ResponseEntity<List<ResultadoSincronizacionDTO>> sincronizarVentasOffline(
            @Valid @RequestBody List<VentaOfflineDTO> ventas,
            @RequestParam Long dispositivoId) {
        List<ResultadoSincronizacionDTO> resultados =
                dispositivoPOSService.sincronizarVentasOffline(ventas, dispositivoId);
        return ResponseEntity.ok(resultados);
    }

    @GetMapping("/{id}/ventas-pendientes")
    public ResponseEntity<List<VentaPendienteSyncDTO>> obtenerVentasPendientes(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerVentasPendientes(id));
    }

    @PostMapping("/ventas-pendientes/{ventaId}/reintentar")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'GERENTE')")
    public ResponseEntity<ResultadoSincronizacionDTO> reintentarSincronizacion(@PathVariable Long ventaId) {
        return ResponseEntity.ok(dispositivoPOSService.reintentarSincronizacion(ventaId));
    }

    // ============================================
    // LOGS Y AUDITORÍA
    // ============================================

    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'GERENTE')")
    public ResponseEntity<List<DispositivoLogDTO>> obtenerLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerLogs(id, limit));
    }

    @PostMapping("/{id}/log")
    public ResponseEntity<Void> registrarLog(
            @PathVariable Long id,
            @Valid @RequestBody DispositivoLogRequest request) {
        dispositivoPOSService.registrarLog(id, request);
        return ResponseEntity.ok().build();
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    @GetMapping("/{id}/estadisticas")
    public ResponseEntity<EstadisticasDispositivoDTO> obtenerEstadisticas(
            @PathVariable Long id,
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        return ResponseEntity.ok(dispositivoPOSService.obtenerEstadisticas(id, fechaInicio, fechaFin));
    }
}
```

### DispositivoPOSService.java

```java
package com.club.management.service;

import com.club.management.dto.*;
import com.club.management.entity.*;
import com.club.management.repository.*;
import com.club.management.exception.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DispositivoPOSService {

    private final DispositivoPOSRepository dispositivoPOSRepository;
    private final VentaPendienteSyncRepository ventaPendienteSyncRepository;
    private final VentaService ventaService;
    private final BCryptPasswordEncoder passwordEncoder;

    // ============================================
    // GESTIÓN DE DISPOSITIVOS
    // ============================================

    @Transactional
    public DispositivoPOSDTO registrar(DispositivoPOSRequest request) {
        // Generar UUID único
        String uuid = UUID.randomUUID().toString();

        // Cifrar PIN
        String pinCifrado = passwordEncoder.encode(request.getPin());

        DispositivoPOS dispositivo = DispositivoPOS.builder()
                .uuid(uuid)
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .tipo(request.getTipo())
                .ubicacion(request.getUbicacion())
                .pinRapido(pinCifrado)
                .categoriasPredeterminadas(request.getCategoriasPredeterminadas())
                .configImpresora(request.getConfigImpresora())
                .tieneLectorBarras(request.getTieneLectorBarras())
                .tieneCajonDinero(request.getTieneCajonDinero())
                .tienePantallaCliente(request.getTienePantallaCliente())
                .permisos(request.getPermisos())
                .activo(true)
                .modoOfflineHabilitado(true)
                .build();

        dispositivo = dispositivoPOSRepository.save(dispositivo);
        log.info("Dispositivo POS registrado: {} (UUID: {})", dispositivo.getNombre(), dispositivo.getUuid());

        return mapToDTO(dispositivo);
    }

    @Transactional(readOnly = true)
    public List<DispositivoPOSDTO> listarTodos() {
        return dispositivoPOSRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DispositivoPOSDTO> listarActivos() {
        return dispositivoPOSRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    @Transactional
    public AuthDispositivoDTO autenticarConPIN(String uuid, String pin) {
        DispositivoPOS dispositivo = dispositivoPOSRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado: " + uuid));

        if (!dispositivo.getActivo()) {
            throw new UnauthorizedException("Dispositivo desactivado");
        }

        if (!passwordEncoder.matches(pin, dispositivo.getPinRapido())) {
            registrarLogInterno(dispositivo.getId(), "LOGIN_FALLIDO", "PIN incorrecto");
            throw new UnauthorizedException("PIN incorrecto");
        }

        // Actualizar última conexión
        dispositivo.setUltimaConexion(LocalDateTime.now());
        dispositivoPOSRepository.save(dispositivo);

        // Registrar log
        registrarLogInterno(dispositivo.getId(), "LOGIN", "Autenticación exitosa");

        // Generar token JWT específico para el dispositivo
        String token = jwtService.generateDeviceToken(dispositivo);

        return AuthDispositivoDTO.builder()
                .token(token)
                .dispositivo(mapToDTO(dispositivo))
                .configuracion(obtenerConfiguracion(dispositivo.getId()))
                .build();
    }

    // ============================================
    // SINCRONIZACIÓN OFFLINE
    // ============================================

    @Transactional
    public List<ResultadoSincronizacionDTO> sincronizarVentasOffline(
            List<VentaOfflineDTO> ventas, Long dispositivoId) {

        DispositivoPOS dispositivo = dispositivoPOSRepository.findById(dispositivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispositivo no encontrado"));

        List<ResultadoSincronizacionDTO> resultados = ventas.stream()
                .map(venta -> sincronizarVentaIndividual(venta, dispositivo))
                .collect(Collectors.toList());

        // Actualizar última sincronización
        dispositivo.setUltimaSincronizacion(LocalDateTime.now());
        dispositivoPOSRepository.save(dispositivo);

        log.info("Sincronizadas {} ventas del dispositivo: {}", resultados.size(), dispositivo.getNombre());

        return resultados;
    }

    private ResultadoSincronizacionDTO sincronizarVentaIndividual(
            VentaOfflineDTO ventaOffline, DispositivoPOS dispositivo) {

        try {
            // Verificar si ya fue sincronizada por UUID
            if (ventaPendienteSyncRepository.existsByUuidVentaAndSincronizadaTrue(ventaOffline.getUuidVenta())) {
                log.warn("Venta {} ya fue sincronizada, omitiendo", ventaOffline.getUuidVenta());
                return ResultadoSincronizacionDTO.duplicado(ventaOffline.getUuidVenta());
            }

            // Crear venta en el sistema
            VentaDTO ventaCreada = ventaService.create(ventaOffline.getDatosVenta());

            // Marcar como sincronizada
            VentaPendienteSync pendiente = VentaPendienteSync.builder()
                    .dispositivoId(dispositivo.getId())
                    .uuidVenta(ventaOffline.getUuidVenta())
                    .datosVenta(ventaOffline.getDatosVenta())
                    .sincronizada(true)
                    .fechaSincronizacion(LocalDateTime.now())
                    .ventaId(ventaCreada.getId())
                    .build();

            ventaPendienteSyncRepository.save(pendiente);

            log.info("Venta offline {} sincronizada exitosamente (ID: {})",
                    ventaOffline.getUuidVenta(), ventaCreada.getId());

            return ResultadoSincronizacionDTO.exitoso(ventaOffline.getUuidVenta(), ventaCreada.getId());

        } catch (Exception e) {
            log.error("Error sincronizando venta {}: {}", ventaOffline.getUuidVenta(), e.getMessage());

            // Guardar en pendientes para retry
            VentaPendienteSync pendiente = VentaPendienteSync.builder()
                    .dispositivoId(dispositivo.getId())
                    .uuidVenta(ventaOffline.getUuidVenta())
                    .datosVenta(ventaOffline.getDatosVenta())
                    .sincronizada(false)
                    .intentosSincronizacion(1)
                    .ultimoIntento(LocalDateTime.now())
                    .proximoIntento(LocalDateTime.now().plusMinutes(5))
                    .errorSincronizacion(e.getMessage())
                    .build();

            ventaPendienteSyncRepository.save(pendiente);

            return ResultadoSincronizacionDTO.error(ventaOffline.getUuidVenta(), e.getMessage());
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    private DispositivoPOSDTO mapToDTO(DispositivoPOS dispositivo) {
        return DispositivoPOSDTO.builder()
                .id(dispositivo.getId())
                .uuid(dispositivo.getUuid())
                .nombre(dispositivo.getNombre())
                .tipo(dispositivo.getTipo())
                .ubicacion(dispositivo.getUbicacion())
                .activo(dispositivo.getActivo())
                .ultimaConexion(dispositivo.getUltimaConexion())
                // ... otros campos
                .build();
    }
}
```

---

## 📱 Frontend - PWA Configuration

### manifest.json

```json
{
  "name": "Club Management POS Terminal",
  "short_name": "POS Terminal",
  "description": "Terminal de punto de venta standalone para Club Management System",
  "start_url": "/pos-terminal/standalone?source=pwa",
  "display": "standalone",
  "orientation": "landscape",
  "theme_color": "#1f2937",
  "background_color": "#111827",
  "scope": "/pos-terminal/",
  "icons": [
    {
      "src": "/icons/pos-icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pos-icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pos-icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pos-icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pos-icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pos-icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/pos-icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pos-icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/pos-terminal-landscape.png",
      "sizes": "1280x720",
      "type": "image/png",
      "platform": "wide",
      "label": "Terminal POS en modo horizontal"
    },
    {
      "src": "/screenshots/pos-terminal-productos.png",
      "sizes": "1280x720",
      "type": "image/png",
      "platform": "wide",
      "label": "Vista de productos táctiles"
    }
  ],
  "categories": ["business", "finance", "productivity"],
  "prefer_related_applications": false,
  "related_applications": [],
  "dir": "ltr",
  "lang": "es-ES",
  "iarc_rating_id": "",
  "shortcuts": [
    {
      "name": "Nueva Venta",
      "short_name": "Venta",
      "description": "Iniciar una nueva venta rápidamente",
      "url": "/pos-terminal/standalone?action=new",
      "icons": [{ "src": "/icons/new-sale-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Sincronizar",
      "short_name": "Sync",
      "description": "Sincronizar ventas pendientes",
      "url": "/pos-terminal/standalone?action=sync",
      "icons": [{ "src": "/icons/sync-96.png", "sizes": "96x96" }]
    }
  ]
}
```

### Service Worker Registration

```typescript
// registerServiceWorker.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/pos-terminal/',
        });

        console.log('✅ Service Worker registrado:', registration.scope);

        // Escuchar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                notifyNewVersion();
              }
            });
          }
        });

        // Solicitar notificaciones
        if ('Notification' in window && Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }

      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
      }
    });
  }
}

function notifyNewVersion() {
  if (confirm('Hay una nueva versión disponible. ¿Deseas actualizar?')) {
    window.location.reload();
  }
}
```

---

## 🔐 Seguridad

### 1. Autenticación por Dispositivo
- PIN de 4-6 dígitos cifrado con BCrypt
- Token JWT específico por dispositivo
- Expiración de token: 12 horas
- Refresh token: 7 días

### 2. Validación de Permisos
```java
// Permisos configurables por dispositivo
{
  "puede_descuentos": false,
  "puede_cancelar": false,
  "max_descuento": 10,
  "max_venta_sin_supervisor": 500,
  "requiere_supervisor_para": ["DEVOLUCION", "CANCELACION"]
}
```

### 3. Cifrado de Datos Offline
```typescript
// Cifrar ventas en IndexedDB
import CryptoJS from 'crypto-js';

function encryptVenta(venta: VentaRequest, deviceKey: string): string {
  return CryptoJS.AES.encrypt(
    JSON.stringify(venta),
    deviceKey
  ).toString();
}

function decryptVenta(encrypted: string, deviceKey: string): VentaRequest {
  const decrypted = CryptoJS.AES.decrypt(encrypted, deviceKey);
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}
```

### 4. Auditoría Completa
- Log de todos los logins
- Log de todas las ventas
- Log de intentos fallidos
- Tracking de IP y User Agent
- Alertas de actividad sospechosa

---

## 📊 Plan de Implementación

### Fase 1: Backend (3 días)
- [ ] Migración V021 + seeding
- [ ] Entities + Repositories
- [ ] Services completos
- [ ] Controllers con validación
- [ ] Tests unitarios e integración

### Fase 2: Frontend Core (3 días)
- [ ] POSStandalonePage layout
- [ ] POSStandaloneLogin con PIN
- [ ] POSStandaloneTerminal completo
- [ ] Componentes táctiles optimizados
- [ ] Integración con API

### Fase 3: PWA + Offline (2 días)
- [ ] Service Worker con Workbox
- [ ] Estrategias de caché
- [ ] IndexedDB para ventas offline
- [ ] Lógica de sincronización
- [ ] Background sync

### Fase 4: Testing (2 días)
- [ ] Testing en tablets reales
- [ ] Testing modo offline
- [ ] Testing sincronización
- [ ] Performance audit
- [ ] Lighthouse score 90+

### **Total: 10 días (2 semanas)**

---

## 📈 Métricas de Éxito

### Performance
- ✅ Lighthouse Score: 90+ (todas las métricas)
- ✅ First Contentful Paint: < 1s
- ✅ Time to Interactive: < 2s
- ✅ Bundle Size: < 500KB

### Usabilidad
- ✅ Venta completa en < 30 segundos
- ✅ Login en < 5 segundos
- ✅ Navegación sin scrolling vertical
- ✅ Botones mínimo 60x60px

### Confiabilidad
- ✅ 99.9% de ventas sincronizadas
- ✅ < 1% de fallos en modo offline
- ✅ 100% de transacciones auditadas
- ✅ 0 pérdidas de datos

---

**Documento creado por:** Claude Code
**Fecha:** 12 Octubre 2025
**Versión:** 1.0
**Estado:** Especificación Completa
**Próximo paso:** Aprobación + Inicio de Fase 1
