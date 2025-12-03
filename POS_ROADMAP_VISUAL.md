# 🎯 Roadmap Visual - Sistema POS

## 📊 Diagrama de Gantt - Timeline General

```mermaid
gantt
    title Roadmap Sistema POS - Timeline de Desarrollo
    dateFormat YYYY-MM-DD
    section MVP
    Fase 0: MVP Base                    :f0, 2025-01-01, 3d

    section Mejoras UX
    Fase 1: UX + Analytics              :f1, after f0, 5d

    section Gestión
    Fase 2: Gestión Caja                :f2, after f1, 7d
    Fase 3: Tickets y Comandas          :f3, after f2, 6d
    Fase 4: Descuentos y Propinas       :f4, after f3, 7d

    section Operaciones
    Fase 5: Mesas y Reservas            :f5, after f4, 10d

    section Integraciones
    Fase 6: Integraciones Externas      :f6, after f5, 15d

    section Analytics
    Fase 7: Business Intelligence       :f7, after f6, 12d

    section Mobile
    Fase 8: App Móvil                   :f8, after f7, 20d

    section Avanzado
    Fase 9: Seguridad Avanzada          :f9, after f8, 7d
    Fase 10: Multi-Local                :f10, after f9, 15d
```

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TB
    subgraph "Frontend"
        UI[Interface Web/PWA]
        MOBILE[App Móvil]
    end

    subgraph "Backend API"
        API[REST API Spring Boot]
        AUTH[Autenticación JWT]
        BL[Business Logic]
    end

    subgraph "Servicios"
        POS[POS Service]
        CAJA[Caja Service]
        TICKET[Ticket Service]
        PROMO[Promociones Service]
        RESERVA[Reservas Service]
        ANALYTICS[Analytics Service]
    end

    subgraph "Datos"
        DB[(PostgreSQL)]
        CACHE[(Redis Cache)]
    end

    subgraph "Integraciones"
        TPV[TPV/Datáfono]
        PRINTER[Impresoras]
        BARCODE[Lector Barras]
    end

    UI --> API
    MOBILE --> API
    API --> AUTH
    API --> BL
    BL --> POS
    BL --> CAJA
    BL --> TICKET
    BL --> PROMO
    BL --> RESERVA
    BL --> ANALYTICS
    POS --> DB
    CAJA --> DB
    TICKET --> DB
    PROMO --> DB
    RESERVA --> DB
    ANALYTICS --> DB
    ANALYTICS --> CACHE
    API --> TPV
    API --> PRINTER
    API --> BARCODE

    style UI fill:#4CAF50
    style MOBILE fill:#4CAF50
    style API fill:#2196F3
    style DB fill:#FF9800
    style TPV fill:#9C27B0
    style PRINTER fill:#9C27B0
    style BARCODE fill:#9C27B0
```

---

## 🔄 Flujo de Registro de Consumo

```mermaid
sequenceDiagram
    participant E as Empleado
    participant UI as Interface POS
    participant API as Backend API
    participant PS as POS Service
    participant IS as Inventario Service
    participant DB as Database

    E->>UI: 1. Selecciona producto
    UI->>E: 2. Muestra modal cantidad
    E->>UI: 3. Confirma cantidad
    UI->>API: 4. POST /sesiones/{id}/consumos
    API->>PS: 5. registrarConsumo()
    PS->>DB: 6. Validar stock disponible
    DB-->>PS: 7. Stock OK
    PS->>DB: 8. Insertar consumo
    DB->>DB: 9. Trigger: actualizar totales
    DB->>IS: 10. Trigger: descontar stock
    IS->>DB: 11. Registrar movimiento stock
    DB-->>PS: 12. Consumo registrado
    PS-->>API: 13. ConsumoDTO
    API-->>UI: 14. 201 Created
    UI-->>E: 15. Confirmación visual + sonido
    UI->>UI: 16. Actualizar totales
```

---

## 📈 Evolución del Sistema - Fases

```mermaid
graph LR
    F0[Fase 0<br/>MVP<br/>📝]
    F1[Fase 1<br/>UX Mejorado<br/>✨]
    F2[Fase 2<br/>Gestión Caja<br/>💰]
    F3[Fase 3<br/>Tickets<br/>🎫]
    F4[Fase 4<br/>Promociones<br/>🏷️]
    F5[Fase 5<br/>Mesas<br/>🪑]
    F6[Fase 6<br/>Integraciones<br/>🔗]
    F7[Fase 7<br/>Analytics<br/>📊]
    F8[Fase 8<br/>App Móvil<br/>📱]
    F9[Fase 9<br/>Seguridad<br/>🔐]
    F10[Fase 10<br/>Multi-Local<br/>🌐]

    F0 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> F6
    F6 --> F7
    F7 --> F8
    F8 --> F9
    F9 --> F10

    style F0 fill:#4CAF50,color:#fff
    style F1 fill:#8BC34A,color:#fff
    style F2 fill:#CDDC39,color:#000
    style F3 fill:#FFEB3B,color:#000
    style F4 fill:#FFC107,color:#000
    style F5 fill:#FF9800,color:#fff
    style F6 fill:#FF5722,color:#fff
    style F7 fill:#F44336,color:#fff
    style F8 fill:#E91E63,color:#fff
    style F9 fill:#9C27B0,color:#fff
    style F10 fill:#673AB7,color:#fff
```

---

## 🎯 Priorización de Fases

```mermaid
quadrantChart
    title Prioridad vs Complejidad
    x-axis Baja Complejidad --> Alta Complejidad
    y-axis Baja Prioridad --> Alta Prioridad
    quadrant-1 Hacer Después
    quadrant-2 Hacer Primero
    quadrant-3 Opcional
    quadrant-4 Planificar Bien

    Fase 0: [0.2, 0.95]
    Fase 1: [0.3, 0.9]
    Fase 2: [0.5, 0.85]
    Fase 3: [0.6, 0.8]
    Fase 4: [0.55, 0.6]
    Fase 5: [0.75, 0.65]
    Fase 6: [0.85, 0.5]
    Fase 7: [0.7, 0.45]
    Fase 8: [0.9, 0.4]
    Fase 9: [0.65, 0.3]
    Fase 10: [0.8, 0.25]
```

---

## 📊 Modelo de Datos - Evolución

### Fase 0: MVP

```mermaid
erDiagram
    SESIONES_VENTA ||--o{ CONSUMOS_SESION : contiene
    SESIONES_VENTA }o--|| EMPLEADOS : asignada_a
    SESIONES_VENTA }o--|| EVENTOS : asociada_a
    CONSUMOS_SESION }o--|| PRODUCTOS : registra

    SESIONES_VENTA {
        bigint id PK
        varchar codigo UK
        varchar nombre
        timestamp fecha_apertura
        timestamp fecha_cierre
        varchar estado
        decimal valor_total
    }

    CONSUMOS_SESION {
        bigint id PK
        bigint sesion_id FK
        bigint producto_id FK
        decimal cantidad
        decimal precio_unitario
        decimal subtotal
        timestamp fecha_consumo
    }

    PRODUCTOS {
        bigint id PK
        varchar codigo
        varchar nombre
        decimal precio_venta
        decimal stock_actual
    }
```

### Fase 2: + Gestión de Caja

```mermaid
erDiagram
    SESIONES_VENTA ||--o{ CONSUMOS_SESION : contiene
    SESIONES_VENTA ||--o{ MOVIMIENTOS_CAJA : registra
    SESIONES_VENTA ||--|| CUADRES_CAJA : cierra_con

    MOVIMIENTOS_CAJA {
        bigint id PK
        bigint sesion_id FK
        varchar tipo
        varchar metodo_pago
        decimal monto
        timestamp fecha_movimiento
    }

    CUADRES_CAJA {
        bigint id PK
        bigint sesion_id FK
        decimal efectivo_esperado
        decimal efectivo_real
        decimal diferencia
        varchar estado
    }
```

### Fase 3: + Tickets y Comandas

```mermaid
erDiagram
    SESIONES_VENTA ||--o{ COMANDAS : genera
    COMANDAS ||--o{ CONSUMOS_SESION : agrupa

    COMANDAS {
        bigint id PK
        bigint sesion_id FK
        varchar numero_comanda
        varchar mesa
        varchar estado
        decimal total
        boolean pagado
    }
```

### Fase 5: + Mesas y Reservas

```mermaid
erDiagram
    AREAS ||--o{ MESAS : contiene
    MESAS ||--o{ RESERVAS : recibe
    MESAS ||--o{ SESIONES_VENTA : usa

    AREAS {
        bigint id PK
        varchar nombre
        varchar tipo
    }

    MESAS {
        bigint id PK
        varchar codigo
        bigint area_id FK
        varchar estado
        int capacidad
    }

    RESERVAS {
        bigint id PK
        varchar codigo
        bigint mesa_id FK
        varchar nombre_cliente
        timestamp fecha_reserva
        varchar estado
        decimal consumo_minimo
    }
```

---

## 🔀 Estados del Sistema

### Estados de Sesión

```mermaid
stateDiagram-v2
    [*] --> ABIERTA: Abrir Sesión
    ABIERTA --> CERRADA: Cerrar Sesión
    ABIERTA --> CANCELADA: Cancelar Sesión
    CERRADA --> [*]
    CANCELADA --> [*]

    note right of ABIERTA
        Registrando consumos
        Totales actualizándose
    end note

    note right of CERRADA
        Sesión finalizada
        Totales congelados
    end note
```

### Estados de Comanda (Fase 3)

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE: Crear Comanda
    PENDIENTE --> EN_PREPARACION: Iniciar
    EN_PREPARACION --> LISTO: Completar
    LISTO --> ENTREGADO: Entregar
    ENTREGADO --> [*]

    PENDIENTE --> CANCELADO: Cancelar
    EN_PREPARACION --> CANCELADO: Cancelar
    CANCELADO --> [*]
```

### Estados de Mesa (Fase 5)

```mermaid
stateDiagram-v2
    [*] --> LIBRE: Mesa disponible
    LIBRE --> RESERVADA: Hacer reserva
    LIBRE --> OCUPADA: Cliente llega
    RESERVADA --> OCUPADA: Check-in
    RESERVADA --> LIBRE: Cancelar/No-show
    OCUPADA --> LIBRE: Cliente sale
    LIBRE --> BLOQUEADA: Mantenimiento
    BLOQUEADA --> LIBRE: Habilitar
```

---

## 📱 Flujo de Usuario - Interfaz POS

```mermaid
graph TD
    START([Inicio]) --> LOGIN{¿Autenticado?}
    LOGIN -->|No| AUTH[Login]
    AUTH --> MENU
    LOGIN -->|Sí| MENU[Menú Principal]

    MENU --> POS[Abrir POS]
    MENU --> HIST[Ver Historial]
    MENU --> REP[Reportes]

    POS --> SESION{¿Hay sesión<br/>abierta?}
    SESION -->|No| OPEN[Abrir Nueva Sesión]
    OPEN --> GRID
    SESION -->|Sí| GRID[Grid de Productos]

    GRID --> SELECT[Seleccionar Producto]
    SELECT --> QTY[Ingresar Cantidad]
    QTY --> CONFIRM[Confirmar Consumo]
    CONFIRM --> UPDATE[Actualizar Totales]
    UPDATE --> GRID

    GRID --> CLOSE[Cerrar Sesión]
    CLOSE --> CUADRE[Cuadre de Caja]
    CUADRE --> SUMMARY[Ver Resumen]
    SUMMARY --> END([Fin])

    style START fill:#4CAF50,color:#fff
    style END fill:#F44336,color:#fff
    style GRID fill:#2196F3,color:#fff
    style CONFIRM fill:#FF9800,color:#fff
```

---

## 🎨 Wireframes - Fase 0 (MVP)

### Pantalla Principal POS

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🏠 Club Management  │  POS                              👤 Admin ▼ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────────────────┐  ┌─────────────────────────────┐│
│  │  Sesión Activa                │  │  Totales                    ││
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━  ││
│  │  SES-20251009123456           │  │  🕒 Duración: 45 min        ││
│  │  Empleado: Juan Pérez         │  │  📦 Items: 23              ││
│  │                                │  │  💰 Total: 184.50€         ││
│  │  [🔴 Cerrar Sesión]            │  │                             ││
│  └───────────────────────────────┘  └─────────────────────────────┘│
│                                                                      │
│  Productos                                   🔍 [Buscar producto...] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                      │
│  Bebidas Alcohólicas                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                       │
│  │ 🍹     │ │ 🥃     │ │ 🍾     │ │ 🍺     │                       │
│  │ Gin    │ │ Whisky │ │ Vodka  │ │ Cerveza│                       │
│  │ Tonic  │ │ Cola   │ │        │ │ Estrella│                      │
│  │        │ │        │ │        │ │        │                       │
│  │ 8.00€  │ │ 9.00€  │ │ 120€   │ │ 3.50€  │                       │
│  │ COPA   │ │ COPA   │ │BOTELLA │ │UNIDAD  │                       │
│  └────────┘ └────────┘ └────────┘ └────────┘                       │
│                                                                      │
│  Refrescos                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐                                  │
│  │ 🥤     │ │ 🧃     │ │ 💧     │                                  │
│  │ Cola   │ │ Naranja│ │ Agua   │                                  │
│  │        │ │        │ │        │                                  │
│  │ 2.50€  │ │ 2.50€  │ │ 2.00€  │                                  │
│  └────────┘ └────────┘ └────────┘                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Panel de Consumos

```
┌─────────────────────────────────────────────────────────────────┐
│  Consumos de la Sesión (12)                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Hora    Producto           Cant.  Precio    Subtotal           │
│  ─────────────────────────────────────────────────────────────  │
│  12:45   Gin Tonic         2      8.00€     16.00€             │
│  12:47   Cerveza Estrella  1      3.50€      3.50€             │
│  12:52   Whisky Cola       1      9.00€      9.00€             │
│  12:58   Agua              2      2.00€      4.00€             │
│  13:05   Gin Tonic         3      8.00€     24.00€             │
│  13:12   Cola              1      2.50€      2.50€             │
│  13:18   Vodka (botella)   1    120.00€    120.00€             │
│  13:25   Gin Tonic         1      8.00€      8.00€             │
│  ─────────────────────────────────────────────────────────────  │
│                                     TOTAL:   184.50€            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Distribución de Esfuerzo por Fase

```mermaid
pie title Distribución de Tiempo de Desarrollo
    "Fase 0: MVP" : 3
    "Fase 1: UX" : 5
    "Fase 2: Caja" : 7
    "Fase 3: Tickets" : 6
    "Fase 4: Promociones" : 7
    "Fase 5: Mesas" : 10
    "Fase 6: Integraciones" : 15
    "Fase 7: Analytics" : 12
    "Fase 8: Móvil" : 20
    "Fase 9: Seguridad" : 7
    "Fase 10: Multi-Local" : 15
```

---

## 🎯 KPIs por Fase

### Fase 0: MVP
- ✅ Tiempo registro consumo < 5 seg
- ✅ Disponibilidad > 99%
- ✅ Stock actualizado en tiempo real

### Fase 1: UX Mejorado
- ✅ Clicks para registrar < 3
- ✅ Tiempo búsqueda producto < 2 seg
- ✅ Satisfacción usuario > 8/10

### Fase 2: Gestión Caja
- ✅ Cuadre automático 95% exacto
- ✅ Tiempo de cierre < 5 min
- ✅ Reducción diferencias caja -80%

### Fase 3: Tickets
- ✅ Tiempo generación ticket < 1 seg
- ✅ Tasa impresión correcta > 98%
- ✅ Tiempo cocina-entrega -30%

---

## 🚀 Releases Planificados

```mermaid
timeline
    title Releases del Sistema POS
    section 2025 Q1
        v0.1 MVP : Registro básico consumos
        v0.2 UX : Interface mejorada
                : Analytics básicos
    section 2025 Q2
        v0.3 Caja : Gestión de caja
                  : Cuadres automáticos
        v0.4 Tickets : Comandas y tickets
                     : Impresoras térmicas
    section 2025 Q3
        v0.5 Promociones : Descuentos
                         : Propinas
        v0.6 Reservas : Mesas
                      : Reservados VIP
    section 2025 Q4
        v1.0 Producción : Integraciones TPV
                        : Analytics avanzado
                        : App móvil
```

---

## 🔧 Stack Tecnológico Visual

```mermaid
graph TB
    subgraph "Capa de Presentación"
        WEB[React + TypeScript<br/>TailwindCSS]
        PWA[Progressive Web App]
        NATIVE[App Nativa<br/>React Native]
    end

    subgraph "Capa de API"
        REST[REST API<br/>Spring Boot]
        WS[WebSockets<br/>Tiempo Real]
        SECURITY[Spring Security<br/>JWT]
    end

    subgraph "Capa de Negocio"
        SERVICES[Services Layer]
        VALIDATION[Validaciones]
        BUSINESS[Reglas de Negocio]
    end

    subgraph "Capa de Datos"
        JPA[Spring Data JPA]
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end

    subgraph "Integraciones"
        PAYMENT[Payment Gateway]
        PRINT[Impresoras]
        EXTERNAL[APIs Externas]
    end

    WEB --> REST
    PWA --> REST
    NATIVE --> REST
    REST --> WS
    REST --> SECURITY
    REST --> SERVICES
    SERVICES --> VALIDATION
    SERVICES --> BUSINESS
    SERVICES --> JPA
    JPA --> POSTGRES
    SERVICES --> REDIS
    SERVICES --> PAYMENT
    SERVICES --> PRINT
    SERVICES --> EXTERNAL

    style WEB fill:#61DAFB
    style REST fill:#6DB33F
    style POSTGRES fill:#336791
    style REDIS fill:#DC382D
```

---

## 📈 Crecimiento Esperado de Funcionalidades

```mermaid
xychart-beta
    title "Funcionalidades por Fase"
    x-axis [F0, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10]
    y-axis "Número de Features" 0 --> 100
    bar [5, 12, 25, 35, 45, 58, 70, 80, 90, 95, 100]
    line [5, 12, 25, 35, 45, 58, 70, 80, 90, 95, 100]
```

---

## 🎨 Paleta de Colores del Sistema

### Colores Principales
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   PRIMARY       │   SECONDARY     │   SUCCESS       │   WARNING       │
│   #2196F3       │   #FF9800       │   #4CAF50       │   #FFC107       │
│   ███████████   │   ███████████   │   ███████████   │   ███████████   │
│   Azul          │   Naranja       │   Verde         │   Amarillo      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   ERROR         │   INFO          │   DARK          │   LIGHT         │
│   #F44336       │   #00BCD4       │   #212121       │   #FAFAFA       │
│   ███████████   │   ███████████   │   ███████████   │   ███████████   │
│   Rojo          │   Cian          │   Gris Oscuro   │   Gris Claro    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Estados
- 🟢 ABIERTA - Verde (#4CAF50)
- 🔴 CERRADA - Rojo (#F44336)
- 🟡 PENDIENTE - Amarillo (#FFC107)
- 🔵 EN PROCESO - Azul (#2196F3)

---

## 📱 Responsive Design

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Desktop (1920x1080)                                             │
│  ┌────────────────┬──────────────────────────┬─────────────────┐│
│  │  Sidebar       │  Grid Productos          │  Panel Derecho  ││
│  │  - Menú        │  ┌────┬────┬────┬────┐  │  - Sesión       ││
│  │  - POS         │  │    │    │    │    │  │  - Totales      ││
│  │  - Reportes    │  └────┴────┴────┴────┘  │  - Consumos     ││
│  │  - Config      │  ┌────┬────┬────┬────┐  │                 ││
│  │                │  │    │    │    │    │  │                 ││
│  │                │  └────┴────┴────┴────┘  │                 ││
│  └────────────────┴──────────────────────────┴─────────────────┘│
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐
│ Tablet (768x1024)               │
│ ┌─────────────────────────────┐ │
│ │ 🏠 POS          👤 Admin ▼  │ │
│ ├─────────────────────────────┤ │
│ │ Sesión Activa               │ │
│ │ Totales                     │ │
│ ├─────────────────────────────┤ │
│ │ Grid Productos              │ │
│ │ ┌──────┬──────┬──────┐     │ │
│ │ │      │      │      │     │ │
│ │ └──────┴──────┴──────┘     │ │
│ │ ┌──────┬──────┬──────┐     │ │
│ │ │      │      │      │     │ │
│ │ └──────┴──────┴──────┘     │ │
│ ├─────────────────────────────┤ │
│ │ Lista de Consumos           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

┌──────────────┐
│ Mobile       │
│ (375x667)    │
│ ┌──────────┐ │
│ │☰ POS   👤│ │
│ ├──────────┤ │
│ │ Sesión   │ │
│ │ Activa   │ │
│ ├──────────┤ │
│ │ 🔍 Buscar│ │
│ ├──────────┤ │
│ │ ┌──┬──┐  │ │
│ │ │  │  │  │ │
│ │ └──┴──┘  │ │
│ │ ┌──┬──┐  │ │
│ │ │  │  │  │ │
│ │ └──┴──┘  │ │
│ ├──────────┤ │
│ │🛒 Ver    │ │
│ │  Carrito │ │
│ └──────────┘ │
└──────────────┘
```

---

## 🎓 Curva de Aprendizaje

```mermaid
graph LR
    A[Día 1<br/>Conceptos básicos] --> B[Día 2-3<br/>Práctica guiada]
    B --> C[Día 4-5<br/>Uso independiente]
    C --> D[Semana 2<br/>Dominio completo]

    style A fill:#F44336,color:#fff
    style B fill:#FF9800,color:#fff
    style C fill:#FFC107,color:#000
    style D fill:#4CAF50,color:#fff
```

### Tiempo de Formación por Rol
- 👤 **Camarero**: 30 minutos
- 👨‍💼 **Encargado**: 2 horas
- 👔 **Gerente**: 4 horas
- 👨‍💻 **Admin**: 1 día

---

**¿Cómo visualizar estos diagramas?**
1. GitHub/GitLab renderiza Mermaid automáticamente
2. VS Code con extensión "Markdown Preview Mermaid"
3. Herramientas online: https://mermaid.live/
