# Arquitectura Técnica Sistema POS
## Diseño para Alta Disponibilidad, Escalabilidad y Mantenimiento 0€

---

## 🎯 Requisitos Técnicos

### ✅ Mantenimiento 0€
- No agregar servicios de pago externos
- Usar infraestructura actual
- Auto-gestionado (self-hosted)

### ✅ Escalable
- Preparado para crecimiento
- Arquitectura modular
- Posibilidad de extracción futura

### ✅ Alta Disponibilidad
- **Crítico**: No puede caer durante una sesión activa
- Funcionar offline
- Recuperación automática
- Datos no se pierden nunca

### ✅ Datos Acumulados
- Retención histórica completa
- Analytics a largo plazo
- Auditoría completa

---

## 📐 Decisión de Arquitectura

### ✨ Enfoque Recomendado: **Monolito Modular**

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLUB MANAGEMENT                             │
│                      (Monolito Modular)                          │
├─────────────────────────────────────────────────────────────────┤
│  Módulo POS  │  Módulo Eventos  │  Módulo Inventario  │  Etc.  │
│  (Nuevo)     │  (Existente)     │  (Existente)        │        │
├─────────────────────────────────────────────────────────────────┤
│              Spring Boot 3.2 + PostgreSQL 15                     │
└─────────────────────────────────────────────────────────────────┘
```

### ¿Por qué NO microservicios?

❌ **Contra:**
- Requiere orquestación (Kubernetes = costos)
- Necesita service mesh (Istio = complejidad)
- Múltiples bases de datos = más infraestructura
- Latencia entre servicios
- Sincronización compleja
- DevOps overhead

✅ **Pro del Monolito Modular:**
- Una sola base de datos = transacciones ACID
- Una sola aplicación = deploy simple
- Misma infraestructura actual
- Más rápido para MVP
- Fácil de mantener
- **COSTO: 0€ adicionales**

---

## 🏗️ Arquitectura Detallada

### 1. Estructura del Código (Modular)

```
backend/src/main/java/com/club/management/
│
├── pos/                              # 🆕 MÓDULO POS (AISLADO)
│   ├── entity/
│   │   ├── SesionVenta.java
│   │   └── ConsumoSesion.java
│   ├── repository/
│   │   ├── SesionVentaRepository.java
│   │   └── ConsumoSesionRepository.java
│   ├── service/
│   │   ├── SesionVentaService.java
│   │   ├── ConsumoService.java
│   │   └── PosOfflineService.java    # Gestión offline
│   ├── controller/
│   │   └── SesionVentaController.java
│   ├── dto/
│   │   ├── request/
│   │   └── response/
│   └── exception/
│       └── PosException.java
│
├── shared/                           # Módulos compartidos
│   ├── producto/
│   ├── empleado/
│   └── evento/
│
├── config/                           # Configuración global
│   ├── SecurityConfig.java
│   └── DatabaseConfig.java
│
└── infrastructure/                   # Infraestructura común
    ├── exception/
    └── util/
```

**Ventajas:**
- ✅ Código POS completamente aislado
- ✅ Fácil de testear independientemente
- ✅ Puede extraerse a microservicio más adelante
- ✅ No afecta módulos existentes

---

### 2. Base de Datos: PostgreSQL (Actual)

#### Estrategia de Alta Disponibilidad

```sql
-- 1. Tablas con índices optimizados
CREATE TABLE sesiones_venta (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    -- ... campos ...
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices estratégicos para performance
CREATE INDEX idx_sesiones_estado ON sesiones_venta(estado) WHERE estado = 'ABIERTA';
CREATE INDEX idx_sesiones_fecha ON sesiones_venta(fecha_apertura DESC);
CREATE INDEX idx_sesiones_empleado_activa ON sesiones_venta(empleado_id, estado)
    WHERE estado = 'ABIERTA';

-- 2. Particionado automático (cuando crezca)
-- Particionar por mes automáticamente
CREATE TABLE consumos_sesion (
    id BIGSERIAL,
    fecha_consumo TIMESTAMP NOT NULL,
    -- ... campos ...
) PARTITION BY RANGE (fecha_consumo);

-- Crear particiones automáticamente
CREATE TABLE consumos_2025_01 PARTITION OF consumos_sesion
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Script para crear particiones futuras automáticamente
```

#### Configuración de Conexiones

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20        # Más conexiones para POS
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000  # Detectar fugas
```

#### Backups Automáticos

```bash
# Script de backup automático (ya tienes /backups montado)
#!/bin/bash
# /backups/auto-backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup completo diario
pg_dump -U club_admin -d club_management -F c \
    -f "$BACKUP_DIR/full_$DATE.backup"

# Backup solo tablas POS (más frecuente)
pg_dump -U club_admin -d club_management \
    -t sesiones_venta -t consumos_sesion \
    -F c -f "$BACKUP_DIR/pos_$DATE.backup"

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete

# Cron job: cada 6 horas
# 0 */6 * * * /backups/auto-backup.sh
```

---

### 3. Frontend: Offline-First con LocalStorage

#### Estrategia de Resiliencia

```typescript
// frontend/src/utils/offlineManager.ts

interface OfflineConsumo {
  tempId: string;
  sesionId: number;
  productoId: number;
  cantidad: number;
  timestamp: number;
  synced: boolean;
}

class OfflineManager {
  private static STORAGE_KEY = 'pos_offline_queue';

  // Guardar consumo localmente
  static saveOffline(consumo: RegistrarConsumoRequest, sesionId: number) {
    const queue = this.getQueue();
    const offlineConsumo: OfflineConsumo = {
      tempId: crypto.randomUUID(),
      sesionId,
      ...consumo,
      timestamp: Date.now(),
      synced: false
    };

    queue.push(offlineConsumo);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));

    return offlineConsumo;
  }

  // Sincronizar cuando vuelva conexión
  static async syncQueue() {
    const queue = this.getQueue();
    const pending = queue.filter(c => !c.synced);

    for (const consumo of pending) {
      try {
        await sesionesVentaApi.registrarConsumo(consumo.sesionId, {
          productoId: consumo.productoId,
          cantidad: consumo.cantidad
        });

        this.markAsSynced(consumo.tempId);
      } catch (error) {
        console.error('Error sincronizando:', error);
        // Mantener en cola para reintentar
      }
    }

    // Limpiar sincronizados
    this.cleanSynced();
  }

  // Obtener cola de pendientes
  private static getQueue(): OfflineConsumo[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Marcar como sincronizado
  private static markAsSynced(tempId: string) {
    const queue = this.getQueue();
    const updated = queue.map(c =>
      c.tempId === tempId ? { ...c, synced: true } : c
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  // Limpiar ya sincronizados
  private static cleanSynced() {
    const queue = this.getQueue();
    const pending = queue.filter(c => !c.synced);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pending));
  }
}

export default OfflineManager;
```

#### Hook de React para Offline

```typescript
// frontend/src/hooks/useOfflineSync.ts

import { useEffect, useState } from 'react';
import OfflineManager from '@/utils/offlineManager';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('🟢 Conexión restaurada, sincronizando...');
      await OfflineManager.syncQueue();
      setPendingCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Sin conexión, modo offline activado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sincronizar al cargar si hay pendientes
    if (isOnline) {
      OfflineManager.syncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, pendingCount };
}
```

#### Componente Visual de Estado

```typescript
// frontend/src/components/pos/OfflineIndicator.tsx

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';

export default function OfflineIndicator() {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        <Wifi className="h-3 w-3 mr-1" />
        En línea
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge variant="destructive">
        <WifiOff className="h-3 w-3 mr-1" />
        Sin conexión - Modo offline
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Badge variant="secondary">
        <CloudOff className="h-3 w-3 mr-1" />
        Sincronizando ({pendingCount})
      </Badge>
    );
  }

  return null;
}
```

---

### 4. Caché en Memoria (Sin Redis)

#### Caché de Productos en Frontend

```typescript
// frontend/src/utils/productCache.ts

interface CachedProduct {
  data: Producto[];
  timestamp: number;
  ttl: number;
}

class ProductCache {
  private static CACHE_KEY = 'pos_productos_cache';
  private static TTL = 5 * 60 * 1000; // 5 minutos

  static save(productos: Producto[]) {
    const cached: CachedProduct = {
      data: productos,
      timestamp: Date.now(),
      ttl: this.TTL
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cached));
  }

  static get(): Producto[] | null {
    const raw = localStorage.getItem(this.CACHE_KEY);
    if (!raw) return null;

    const cached: CachedProduct = JSON.parse(raw);
    const age = Date.now() - cached.timestamp;

    if (age > cached.ttl) {
      this.clear();
      return null;
    }

    return cached.data;
  }

  static clear() {
    localStorage.removeItem(this.CACHE_KEY);
  }
}

export default ProductCache;
```

#### Caché en Backend (Spring)

```java
// backend/src/main/java/com/club/management/pos/service/ProductoCacheService.java

package com.club.management.pos.service;

import com.club.management.entity.Producto;
import com.club.management.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoCacheService {

    private final ProductoRepository productoRepository;

    @Cacheable(value = "productos_activos", unless = "#result == null")
    public List<Producto> getProductosActivos() {
        return productoRepository.findByActivoTrue();
    }

    @CacheEvict(value = "productos_activos", allEntries = true)
    public void invalidarCache() {
        // Se llama cuando se actualiza un producto
    }
}
```

```java
// Configuración de caché en memoria (sin Redis)
// backend/src/main/java/com/club/management/config/CacheConfig.java

package com.club.management.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public ConcurrentMapCacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
            "productos_activos",
            "sesiones_activas",
            "estadisticas_hoy"
        );
    }
}
```

---

### 5. Estrategia de Alta Disponibilidad

#### A. Health Checks

```yaml
# docker-compose.yml (YA CONFIGURADO)
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

```java
// backend/src/main/resources/application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
  health:
    db:
      enabled: true
```

#### B. Restart Automático

```yaml
# docker-compose.yml (YA CONFIGURADO)
services:
  backend:
    restart: unless-stopped  # ✅ Ya configurado
  postgres:
    restart: unless-stopped  # ✅ Ya configurado
```

#### C. Circuit Breaker (para futuro)

```java
// Si crece y necesita protección contra cascadas de errores
@Service
public class SesionVentaService {

    @CircuitBreaker(name = "sesionService", fallbackMethod = "fallbackSesion")
    public SesionVentaDTO abrirSesion(SesionVentaRequest request) {
        // Lógica normal
    }

    private SesionVentaDTO fallbackSesion(SesionVentaRequest request, Exception e) {
        // Modo degradado: guardar en caché local y responder OK
        log.error("Circuit breaker activado, usando fallback", e);
        throw new ServiceUnavailableException("Servicio temporalmente no disponible");
    }
}
```

---

### 6. Escalabilidad

#### A. Índices Estratégicos

```sql
-- Índices para consultas frecuentes
CREATE INDEX CONCURRENTLY idx_sesiones_abierta_empleado
    ON sesiones_venta(empleado_id, estado)
    WHERE estado = 'ABIERTA';

CREATE INDEX CONCURRENTLY idx_consumos_sesion_fecha
    ON consumos_sesion(sesion_id, fecha_consumo DESC);

CREATE INDEX CONCURRENTLY idx_consumos_producto_fecha
    ON consumos_sesion(producto_id, fecha_consumo DESC);

-- Índice para analytics rápido
CREATE INDEX CONCURRENTLY idx_consumos_analytics
    ON consumos_sesion(fecha_consumo, producto_id)
    INCLUDE (cantidad, subtotal);
```

#### B. Particionado (cuando crezca)

```sql
-- Script para crear particiones automáticamente
-- Ejecutar mensualmente

CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Próximo mes
    start_date := date_trunc('month', now() + interval '1 month');
    end_date := start_date + interval '1 month';
    partition_name := 'consumos_' || to_char(start_date, 'YYYY_MM');

    -- Crear partición si no existe
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF consumos_sesion
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Cron job: día 1 de cada mes
```

#### C. Read Replicas (Opcional - Futuro)

```yaml
# Si necesitas más lectura que escritura
spring:
  datasource:
    primary:
      url: jdbc:postgresql://postgres-master:5432/club_management
      username: club_admin
      password: ${DB_PASSWORD}

    replica:
      url: jdbc:postgresql://postgres-replica:5432/club_management
      username: club_readonly
      password: ${DB_PASSWORD}
```

---

### 7. Datos Acumulados y Analytics

#### A. Retención de Datos

```sql
-- Nunca borrar datos de sesiones y consumos
-- Solo archivar después de 1 año a tabla histórica

CREATE TABLE sesiones_venta_historico (
    LIKE sesiones_venta INCLUDING ALL
) PARTITION BY RANGE (fecha_apertura);

-- Mover datos antiguos (>1 año) a histórico
-- Ejecutar anualmente
INSERT INTO sesiones_venta_historico
SELECT * FROM sesiones_venta
WHERE fecha_apertura < now() - interval '1 year';

-- Mantener solo 1 año en tabla principal
DELETE FROM sesiones_venta
WHERE fecha_apertura < now() - interval '1 year';
```

#### B. Vistas Materializadas para Analytics

```sql
-- Vista materializada para analytics rápido
CREATE MATERIALIZED VIEW mv_ventas_diarias AS
SELECT
    DATE(fecha_consumo) as fecha,
    COUNT(*) as total_consumos,
    SUM(cantidad) as total_items,
    SUM(subtotal) as total_ventas,
    COUNT(DISTINCT sesion_id) as total_sesiones
FROM consumos_sesion
GROUP BY DATE(fecha_consumo);

-- Índice en la vista
CREATE INDEX ON mv_ventas_diarias(fecha DESC);

-- Refrescar cada noche
-- Cron job: 2am diario
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ventas_diarias;
```

#### C. Agregaciones Pre-calculadas

```sql
-- Tabla de resúmenes por producto (actualizada por trigger)
CREATE TABLE producto_estadisticas (
    producto_id BIGINT PRIMARY KEY,
    total_vendido DECIMAL(10,2) DEFAULT 0,
    cantidad_total DECIMAL(10,2) DEFAULT 0,
    num_ventas INTEGER DEFAULT 0,
    ultima_venta TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Trigger para actualizar en tiempo real
CREATE OR REPLACE FUNCTION actualizar_estadisticas_producto()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO producto_estadisticas (producto_id, total_vendido, cantidad_total, num_ventas, ultima_venta)
    VALUES (NEW.producto_id, NEW.subtotal, NEW.cantidad, 1, NEW.fecha_consumo)
    ON CONFLICT (producto_id) DO UPDATE SET
        total_vendido = producto_estadisticas.total_vendido + NEW.subtotal,
        cantidad_total = producto_estadisticas.cantidad_total + NEW.cantidad,
        num_ventas = producto_estadisticas.num_ventas + 1,
        ultima_venta = NEW.fecha_consumo,
        actualizado_en = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estadisticas_producto
AFTER INSERT ON consumos_sesion
FOR EACH ROW
EXECUTE FUNCTION actualizar_estadisticas_producto();
```

---

### 8. Monitoreo y Observabilidad (Gratis)

#### A. Logs Estructurados

```java
// backend/src/main/resources/logback-spring.xml
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/app/logs/club-pos.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/app/logs/club-pos.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <logger name="com.club.management.pos" level="INFO"/>
    <root level="WARN">
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

#### B. Métricas con Actuator (ya incluido)

```yaml
# application.yml
management:
  metrics:
    export:
      simple:
        enabled: true
    tags:
      application: club-management
      module: pos
```

```bash
# Ver métricas
curl http://localhost:8080/actuator/metrics

# Métricas específicas
curl http://localhost:8080/actuator/metrics/jvm.memory.used
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

#### C. Dashboard Simple con Grafana (Opcional)

```yaml
# docker-compose.yml - SOLO SI QUIERES GRAFANA (gratis, self-hosted)
services:
  grafana:
    image: grafana/grafana:latest
    container_name: club_grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - club_network

volumes:
  grafana_data:
```

---

## 🚀 Plan de Implementación Modular

### Fase 0.1: Base de Datos (1 día)
```bash
cd backend/src/main/resources/db/migration
# Crear V010__crear_tablas_pos.sql
```
✅ Tablas con índices optimizados
✅ Triggers para totales
✅ Triggers para stock
✅ Particionado preparado

### Fase 0.2: Backend Core (1 día)
```bash
cd backend/src/main/java/com/club/management/pos
# Crear estructura modular
```
✅ Entidades
✅ Repositorios con queries optimizadas
✅ Servicios con caché
✅ Controllers
✅ DTOs

### Fase 0.3: Frontend Offline-First (1 día)
```bash
cd frontend/src
# Implementar offline manager
```
✅ LocalStorage manager
✅ Sync automático
✅ Hook useOfflineSync
✅ Indicador visual de estado
✅ Caché de productos

### Fase 0.4: Testing y Deploy (medio día)
✅ Tests unitarios
✅ Tests de integración
✅ Deploy a staging
✅ Pruebas de resiliencia (desconectar red)

---

## 📊 Costos de Infraestructura

### Actual (Mantenimiento 0€)
```
PostgreSQL:     Incluido en Docker
Spring Boot:    Incluido en Docker
React Frontend: Incluido en Docker
Backups:        Volumen local (incluido)
Logs:           Volumen local (incluido)
Caché:          En memoria (ConcurrentHashMap)
```

**Total: 0€ adicionales** ✅

### Si Necesitas Escalar (Futuro)
```
VPS con 4GB RAM:        ~10€/mes
PostgreSQL managed:     ~15€/mes (opcional)
CDN para frontend:      Gratis (Cloudflare)
Monitoring (Grafana):   Self-hosted (0€)
```

---

## 🔒 Seguridad

### A. Autenticación (ya implementado)
✅ JWT tokens
✅ Roles y permisos
✅ HTTPS en producción

### B. Validación de Datos
```java
@Service
public class SesionVentaService {

    @Transactional
    public ConsumoSesionDTO registrarConsumo(Long sesionId, RegistrarConsumoRequest request) {
        // 1. Validar sesión existe y está abierta
        SesionVenta sesion = validarSesionAbierta(sesionId);

        // 2. Validar producto existe y activo
        Producto producto = validarProductoActivo(request.getProductoId());

        // 3. Validar stock disponible
        validarStockDisponible(producto, request.getCantidad());

        // 4. Validar cantidad positiva
        if (request.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("La cantidad debe ser mayor a 0");
        }

        // 5. Registrar con transacción
        return registrarConsumoTransaccional(sesion, producto, request);
    }
}
```

### C. Rate Limiting (si necesario)
```java
// Limitar requests por IP/usuario
@Configuration
public class RateLimitConfig {
    @Bean
    public RateLimiter rateLimiter() {
        return RateLimiter.create(100.0); // 100 req/seg
    }
}
```

---

## 📈 Métricas de Éxito

### Performance
- ✅ Tiempo de registro de consumo < 200ms
- ✅ Consulta de sesión activa < 50ms
- ✅ Carga de productos < 100ms (con caché)

### Disponibilidad
- ✅ Uptime > 99.5%
- ✅ Sin pérdida de datos en caída
- ✅ Recuperación automática < 30 segundos

### Escalabilidad
- ✅ Soporta 10 sesiones simultáneas
- ✅ Soporta 100 consumos/minuto
- ✅ Base de datos < 1GB al año

---

## 🔄 Migración Futura a Microservicio (Si es necesario)

```
Paso 1: Código ya modular ✅
Paso 2: Extraer módulo POS a proyecto separado
Paso 3: Crear API Gateway
Paso 4: Sincronización entre servicios
Paso 5: Base de datos separada

Costo adicional: ~20€/mes
```

**Pero por ahora: NO es necesario** ✅

---

## ✅ Conclusión

### Arquitectura Recomendada:
- **Monolito Modular** integrado en aplicación actual
- **PostgreSQL** como única base de datos
- **Offline-first** con LocalStorage + sincronización
- **Caché en memoria** sin Redis
- **Alta disponibilidad** con health checks y restart automático
- **Mantenimiento: 0€** adicionales

### Próximo Paso:
Comenzar implementación siguiendo `POS_IMPLEMENTATION_GUIDE.md`

**Fecha:** 2025-10-09
**Versión:** 1.0
