# Sistema de Mejoras - Club Management System

**Fecha**: 2025-01-18
**Versión**: 2.0
**Estado**: Implementación Parcial (3/12 completadas)

---

## ✅ MEJORAS IMPLEMENTADAS (3/12)

### 1. Dashboard de Analytics de Compras ✅

**Estado**: COMPLETADO
**Archivos creados**:
- `/frontend/src/pages/pedidos/PedidosDashboardPage.tsx` (~400 líneas)

**Funcionalidades**:
- ✅ 4 Cards de estadísticas con tendencias vs mes anterior
  - Total invertido con porcentaje de variación
  - Total de pedidos
  - Promedio por pedido
  - Pedidos pendientes de recepción
- ✅ Gráfica de evolución mensual (configurable: 3/6/12 meses)
  - Línea de pedidos totales
  - Línea de pedidos recibidos
  - Línea de inversión
- ✅ Gráfica circular de distribución por estado
- ✅ Gráfica de barras con Top 5 proveedores por inversión
- ✅ Lista Top 10 productos más comprados
- ✅ Alertas automáticas de pedidos pendientes
- ✅ Integración en routing (`/pedidos/dashboard`)
- ✅ Enlace en menú lateral

**Uso**:
```
Navegación: Inventario → Dashboard Pedidos
```

---

### 2. Sistema de Comparación de Precios e Histórico ✅

**Estado**: COMPLETADO
**Archivos creados**:
- `/frontend/src/components/pedidos/HistoricoPreciosModal.tsx` (~300 líneas)

**Funcionalidades**:
- ✅ Modal que muestra histórico completo de precios de un producto
- ✅ 4 Cards de estadísticas:
  - Precio actual con tendencia
  - Precio promedio histórico
  - Precio mínimo encontrado
  - Precio máximo encontrado
- ✅ Gráfica de línea con evolución temporal de precios
- ✅ Comparación por proveedor:
  - Ranking de proveedores por precio promedio
  - Identificación del proveedor más económico
  - Porcentaje de ahorro entre proveedores
- ✅ Tabla detallada con historial completo:
  - Fecha de cada compra
  - Número de pedido
  - Proveedor
  - Cantidad comprada
  - Precio unitario
  - Variación vs compra anterior

**Uso** (requiere integración):
```typescript
// Desde la página de productos, agregar botón:
<button onClick={() => setProductoSeleccionado(producto)}>
  Ver Histórico de Precios
</button>

<HistoricoPreciosModal
  isOpen={showHistorico}
  onClose={() => setShowHistorico(false)}
  productoId={productoSeleccionado?.id}
  productoNombre={productoSeleccionado?.nombre}
/>
```

**TODO**: Integrar botón en `/frontend/src/pages/productos/ProductosPage.tsx`

---

### 3. Sistema de Notificaciones y Alertas de Pedidos ✅

**Estado**: COMPLETADO
**Archivos creados**:
- `/frontend/src/components/pedidos/AlertasPedidos.tsx` (~150 líneas)

**Funcionalidades**:
- ✅ Detección automática de 3 tipos de alertas:
  1. **Pedidos Atrasados** (rojo): Fecha esperada pasada sin recepcionar
  2. **Próximos a Llegar** (amarillo): Llegan en 1-3 días
  3. **Recepciones Parciales** (azul): Pedidos con recepción incompleta
- ✅ Lista de hasta 3 pedidos por tipo de alerta
- ✅ Click en pedido navega a `/pedidos`
- ✅ Colores distintivos por tipo de alerta
- ✅ Iconos informativos

**Uso** (requiere integración):
```typescript
// En DashboardPage o donde se desee mostrar:
import { AlertasPedidos } from '../components/pedidos/AlertasPedidos';

<AlertasPedidos />
```

**Sugerencias de integración**:
- Dashboard principal (`/dashboard`)
- Dashboard de compras (`/pedidos/dashboard`)
- Página de pedidos como widget lateral

---

## 🔄 MEJORAS PENDIENTES (9/12)

### 4. Historial de Cambios de Estado (Audit Log)

**Objetivo**: Registrar todos los cambios de estado de los pedidos para auditoría.

**Backend requerido**:
```java
// Crear tabla de auditoría
CREATE TABLE pedido_auditoria (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    motivo TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Crear trigger para auto-auditar
CREATE OR REPLACE FUNCTION auditar_cambio_estado_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO pedido_auditoria (pedido_id, estado_anterior, estado_nuevo, usuario_id)
        VALUES (NEW.id, OLD.estado, NEW.estado, NEW.usuario_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditar_pedido
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION auditar_cambio_estado_pedido();
```

**Frontend requerido**:
- Componente `HistorialCambiosModal.tsx` que muestre timeline de cambios
- Integrar en `PedidoDetalleModal`

**Estimación**: 2-3 horas

---

### 5. Sistema de Pedidos Recurrentes/Plantillas

**Objetivo**: Permitir guardar pedidos como plantillas y repetirlos automáticamente.

**Backend requerido**:
```java
// Nueva tabla
CREATE TABLE plantillas_pedido (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    proveedor_id BIGINT NOT NULL REFERENCES proveedores(id),
    periodicidad VARCHAR(50), -- 'SEMANAL', 'MENSUAL', 'TRIMESTRAL'
    activo BOOLEAN DEFAULT true,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_plantilla_pedido (
    id BIGSERIAL PRIMARY KEY,
    plantilla_id BIGINT NOT NULL REFERENCES plantillas_pedido(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    cantidad DECIMAL(10, 2) NOT NULL,
    notas TEXT
);

// Controller y Service
@RestController
@RequestMapping("/api/plantillas-pedido")
public class PlantillaPedidoController {
    // CRUD de plantillas
    // POST /crear-desde-pedido/{pedidoId} - Crear plantilla desde pedido existente
    // POST /{id}/generar-pedido - Generar nuevo pedido desde plantilla
}
```

**Frontend requerido**:
- Botón "Guardar como plantilla" en pedidos
- Página `/pedidos/plantillas` para gestionar plantillas
- Botón "Crear desde plantilla" en nuevo pedido

**Estimación**: 4-5 horas

---

### 6. Sistema de Adjuntos (Albaranes/Facturas PDF)

**Objetivo**: Subir y almacenar archivos PDF relacionados con pedidos.

**Backend requerido**:
```java
// Nueva tabla
CREATE TABLE adjuntos_pedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'ALBARAN', 'FACTURA', 'OTRO'
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamanio_bytes BIGINT,
    content_type VARCHAR(100),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Service para manejar uploads
@Service
public class AdjuntosPedidoService {
    @Value("${app.upload.dir:uploads/pedidos}")
    private String uploadDir;

    public AdjuntoDTO subirArchivo(MultipartFile file, Long pedidoId, String tipo) {
        // Validar tamaño y tipo
        // Guardar archivo en filesystem o S3
        // Registrar en BD
    }
}

// Controller
@PostMapping("/{pedidoId}/adjuntos")
public ResponseEntity<AdjuntoDTO> subirAdjunto(
    @PathVariable Long pedidoId,
    @RequestParam("file") MultipartFile file,
    @RequestParam("tipo") String tipo
) { ... }

@GetMapping("/adjuntos/{id}/download")
public ResponseEntity<Resource> descargarAdjunto(@PathVariable Long id) { ... }
```

**Frontend requerido**:
- Componente de upload de archivos en `PedidoDetalleModal`
- Lista de adjuntos con botones de descarga
- Vista previa de PDFs (iframe o modal)

**Configuración**:
```yaml
# application.yml
app:
  upload:
    dir: /var/app/uploads/pedidos
    max-file-size: 10MB
```

**Estimación**: 5-6 horas

---

### 7. Panel de Administración (Usuarios/Permisos/Logs)

**Objetivo**: Panel centralizado para administradores del sistema.

**Backend requerido**:
```java
// Tabla de logs del sistema
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    nivel VARCHAR(20), -- 'INFO', 'WARNING', 'ERROR'
    modulo VARCHAR(100),
    accion VARCHAR(200),
    usuario_id BIGINT REFERENCES usuarios(id),
    ip_address VARCHAR(50),
    user_agent TEXT,
    detalles JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Service de auditoría
@Service
public class AuditService {
    public void log(String modulo, String accion, Long usuarioId, Map<String, Object> detalles) {
        // Guardar en system_logs
    }
}

// Aspect para auto-loguear
@Aspect
public class AuditAspect {
    @Around("@annotation(Auditable)")
    public Object logAction(ProceedingJoinPoint joinPoint) {
        // Log automático de métodos marcados con @Auditable
    }
}
```

**Frontend requerido**:
- Página `/admin` con tabs:
  - Gestión de usuarios (CRUD)
  - Gestión de roles y permisos
  - Logs del sistema (tabla filtrable)
  - Configuración general
  - Estadísticas de uso

**Estimación**: 8-10 horas

---

### 8. Integraciones entre Módulos (Automatizaciones)

**Objetivo**: Crear automatizaciones inteligentes entre módulos.

**Ejemplos de automatizaciones**:

1. **Auto-crear pedido cuando stock bajo**:
```java
@Scheduled(cron = "0 0 9 * * MON") // Lunes a las 9am
public void generarPedidosAutomaticos() {
    List<AlertaStock> alertas = alertaStockRepository.findActivasPorStockBajo();

    // Agrupar por proveedor
    Map<Long, List<Producto>> productosPorProveedor = ...;

    // Crear pedido automático por cada proveedor
    productosPorProveedor.forEach((proveedorId, productos) -> {
        CrearPedidoRequest request = new CrearPedidoRequest();
        request.setProveedorId(proveedorId);
        request.setNotas("Pedido automático generado por stock bajo");
        // ... agregar productos

        pedidoService.create(request);
    });
}
```

2. **Notificar empleados cuando llega pedido**:
```java
@EventListener
public void onPedidoRecepcionado(PedidoRecepcionadoEvent event) {
    // Enviar email/notificación a encargado de almacén
    notificationService.notifyWarehouseManager(event.getPedido());
}
```

3. **Actualizar presupuesto de compras mensual**:
```java
public void actualizarPresupuestoCompras() {
    BigDecimal gastoMensual = pedidoRepository
        .findByEstadoAndFechaRecepcionBetween(
            EstadoPedido.RECIBIDO,
            inicioMes,
            finMes
        )
        .stream()
        .map(Pedido::getTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    if (gastoMensual.compareTo(presupuestoLimite) > 0) {
        alertService.enviarAlertaPresupuesto(gastoMensual, presupuestoLimite);
    }
}
```

**Estimación**: 6-8 horas

---

### 9. Generación de Reportes PDF con JasperReports

**Objetivo**: Generar reportes profesionales en PDF.

**Backend requerido**:
```xml
<!-- pom.xml -->
<dependency>
    <groupId>net.sf.jasperreports</groupId>
    <artifactId>jasperreports</artifactId>
    <version>6.20.0</version>
</dependency>
```

```java
@Service
public class ReportService {
    public byte[] generarReportePedido(Long pedidoId) throws JRException {
        Pedido pedido = pedidoRepository.findById(pedidoId)
            .orElseThrow(() -> new NotFoundException("Pedido no encontrado"));

        // Cargar plantilla .jrxml
        InputStream template = getClass().getResourceAsStream("/reports/pedido.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(template);

        // Preparar datos
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("numeroPedido", pedido.getNumeroPedido());
        parameters.put("proveedor", pedido.getProveedorNombre());
        // ...

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(
            pedido.getDetalles()
        );

        // Generar PDF
        JasperPrint jasperPrint = JasperFillManager.fillReport(
            jasperReport,
            parameters,
            dataSource
        );

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}

@GetMapping("/{id}/pdf")
public ResponseEntity<byte[]> descargarPDF(@PathVariable Long id) {
    byte[] pdf = reportService.generarReportePedido(id);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.setContentDispositionFormData("filename", "pedido_" + id + ".pdf");

    return ResponseEntity.ok()
        .headers(headers)
        .body(pdf);
}
```

**Plantillas a crear** (en `/resources/reports/`):
- `pedido.jrxml` - Detalle de pedido
- `resumen_mensual_compras.jrxml` - Resumen mensual
- `comparativa_proveedores.jrxml` - Análisis de proveedores

**Frontend requerido**:
- Botón "Descargar PDF" en `PedidoDetalleModal`
- Botón "Generar Reporte Mensual" en dashboard

**Estimación**: 10-12 horas (incluye diseño de plantillas)

---

### 10. Sistema de Backup Automatizado

**Objetivo**: Backups automáticos de la base de datos.

**Script de backup** (`/scripts/backup.sh`):
```bash
#!/bin/bash
set -e

# Configuración
DB_NAME="club_management"
DB_USER="club_admin"
BACKUP_DIR="/var/backups/club-management"
RETENTION_DAYS=30

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Nombre del archivo con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Hacer backup
echo "Iniciando backup de $DB_NAME..."
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Verificar
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completado: $BACKUP_FILE ($SIZE)"
else
    echo "❌ Error: Backup falló"
    exit 1
fi

# Limpiar backups antiguos
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Backups antiguos eliminados (>${RETENTION_DAYS} días)"

# Opcional: Subir a S3
# aws s3 cp $BACKUP_FILE s3://mi-bucket/backups/

echo "Backup finalizado exitosamente"
```

**Crontab** (ejecutar diariamente a las 2 AM):
```bash
0 2 * * * /var/app/scripts/backup.sh >> /var/log/backup.log 2>&1
```

**Script de restauración** (`/scripts/restore.sh`):
```bash
#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Uso: ./restore.sh <archivo_backup.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="club_management"
DB_USER="club_admin"

echo "⚠️ ADVERTENCIA: Esto sobrescribirá la base de datos actual"
read -p "¿Continuar? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restauración cancelada"
    exit 0
fi

echo "Restaurando desde $BACKUP_FILE..."
gunzip -c $BACKUP_FILE | psql -U $DB_USER -d $DB_NAME

echo "✅ Restauración completada"
```

**Monitoring**:
```java
@RestController
@RequestMapping("/api/admin/backups")
public class BackupController {

    @GetMapping
    public List<BackupInfo> listarBackups() {
        // Listar archivos en directorio de backups
        // Retornar: fecha, tamaño, ubicación
    }

    @PostMapping("/manual")
    public ResponseEntity<?> crearBackupManual() {
        // Ejecutar script de backup
        ProcessBuilder pb = new ProcessBuilder("/var/app/scripts/backup.sh");
        Process process = pb.start();
        // ...
    }
}
```

**Estimación**: 3-4 horas

---

### 11. Mejoras en Módulos Existentes

**Objetivo**: Pulir módulos existentes con mejoras menores.

**Lista de mejoras**:

1. **Módulo de Eventos**:
   - Dashboard de eventos con métricas
   - Calendario visual de eventos
   - Sistema de confirmación de asistencia

2. **Módulo de Inventario**:
   - Escaneo de códigos de barras
   - Alertas de productos próximos a caducar
   - Sugerencias de reorden basadas en tendencias

3. **Módulo de Finanzas**:
   - Gráficas de flujo de caja
   - Proyecciones financieras
   - Categorización automática con ML

4. **Módulo de Empleados**:
   - Portal de auto-servicio para empleados
   - Sistema de solicitud de vacaciones
   - Evaluaciones de desempeño

**Estimación**: 15-20 horas (todas las mejoras)

---

### 12. API Webhooks para Notificaciones Externas

**Objetivo**: Permitir integraciones externas mediante webhooks.

**Backend requerido**:
```java
// Tabla de webhooks configurados
CREATE TABLE webhooks (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    eventos VARCHAR(500)[], -- ['pedido.recibido', 'stock.bajo', etc.]
    headers JSONB,
    activo BOOLEAN DEFAULT true,
    secreto VARCHAR(255), -- Para firmar requests
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_logs (
    id BIGSERIAL PRIMARY KEY,
    webhook_id BIGINT NOT NULL REFERENCES webhooks(id),
    evento VARCHAR(100),
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Service de webhooks
@Service
public class WebhookService {

    @Async
    public void enviarWebhook(String evento, Object payload) {
        List<Webhook> webhooks = webhookRepository.findByEventoAndActivo(evento, true);

        webhooks.forEach(webhook -> {
            try {
                String json = objectMapper.writeValueAsString(payload);
                String firma = generarFirmaHMAC(json, webhook.getSecreto());

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("X-Webhook-Signature", firma);
                headers.set("X-Webhook-Event", evento);

                // Agregar headers personalizados
                if (webhook.getHeaders() != null) {
                    webhook.getHeaders().forEach(headers::set);
                }

                HttpEntity<String> request = new HttpEntity<>(json, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(
                    webhook.getUrl(),
                    request,
                    String.class
                );

                // Log exitoso
                webhookLogRepository.save(new WebhookLog(
                    webhook.getId(),
                    evento,
                    json,
                    response.getStatusCodeValue(),
                    response.getBody(),
                    null
                ));

            } catch (Exception e) {
                // Log error
                webhookLogRepository.save(new WebhookLog(
                    webhook.getId(),
                    evento,
                    json,
                    null,
                    null,
                    e.getMessage()
                ));
            }
        });
    }

    private String generarFirmaHMAC(String data, String secret) {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes());
        return Hex.encodeHexString(hash);
    }
}

// Eventos a emitir
@Component
public class PedidoEventPublisher {

    @Autowired
    private WebhookService webhookService;

    @EventListener
    public void onPedidoRecibido(PedidoRecepcionadoEvent event) {
        webhookService.enviarWebhook("pedido.recibido", event.getPedido());
    }

    @EventListener
    public void onStockBajo(StockBajoEvent event) {
        webhookService.enviarWebhook("stock.bajo", event.getProducto());
    }
}
```

**Frontend requerido**:
- Página `/admin/webhooks` para configurar webhooks
- Test de webhook (enviar evento de prueba)
- Log de entregas (éxitos/fallos)

**Eventos disponibles**:
- `pedido.creado`
- `pedido.recibido`
- `pedido.cancelado`
- `stock.bajo`
- `stock.critico`
- `empleado.creado`
- `transaccion.creada`

**Estimación**: 6-8 horas

---

## 📊 RESUMEN DE ESTIMACIONES

| Mejora | Estado | Estimación | Prioridad |
|--------|--------|------------|-----------|
| 1. Dashboard Analytics | ✅ COMPLETADO | - | - |
| 2. Histórico de Precios | ✅ COMPLETADO | - | - |
| 3. Alertas de Pedidos | ✅ COMPLETADO | - | - |
| 4. Audit Log | ⏳ Pendiente | 2-3h | Alta |
| 5. Pedidos Recurrentes | ⏳ Pendiente | 4-5h | Media |
| 6. Adjuntos PDF | ⏳ Pendiente | 5-6h | Alta |
| 7. Panel Admin | ⏳ Pendiente | 8-10h | Alta |
| 8. Automatizaciones | ⏳ Pendiente | 6-8h | Media |
| 9. Reportes PDF | ⏳ Pendiente | 10-12h | Media |
| 10. Sistema Backup | ⏳ Pendiente | 3-4h | Alta |
| 11. Mejoras Módulos | ⏳ Pendiente | 15-20h | Baja |
| 12. Webhooks | ⏳ Pendiente | 6-8h | Baja |

**Total estimado**: 60-76 horas de desarrollo

---

## 🚀 ROADMAP SUGERIDO

### Sprint 1 (Alta Prioridad) - 18-23 horas
1. Sistema de Backup Automatizado
2. Audit Log de Pedidos
3. Sistema de Adjuntos PDF
4. Panel de Administración

### Sprint 2 (Media Prioridad) - 20-25 horas
5. Pedidos Recurrentes/Plantillas
6. Automatizaciones entre Módulos
7. Reportes PDF con JasperReports

### Sprint 3 (Baja Prioridad) - 21-28 horas
8. Webhooks para Integraciones
9. Mejoras en Módulos Existentes

---

## 📋 CHECKLIST DE DEPLOYMENT

Antes de desplegar a producción:

- [ ] Compilar backend: `./mvnw clean package`
- [ ] Compilar frontend: `npm run build`
- [ ] Ejecutar tests: `./mvnw test && npm test`
- [ ] Verificar migraciones de BD
- [ ] Configurar variables de entorno
- [ ] Configurar backups automáticos
- [ ] Documentar cambios en CHANGELOG.md
- [ ] Actualizar versión en package.json y pom.xml
- [ ] Crear tag de release en Git
- [ ] Deploy a staging para QA
- [ ] Deploy a producción
- [ ] Monitorear logs post-deployment

---

**Fin del documento**
