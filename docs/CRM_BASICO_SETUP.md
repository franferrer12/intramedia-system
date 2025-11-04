# 🎯 CRM Básico - Setup e Instrucciones

## ✅ Lo que se ha implementado

### Backend
- ✅ Modelo `Lead` con todos los métodos CRUD
- ✅ Controlador `leadsController.js` con todas las funciones
- ✅ Rutas `/api/leads` con todos los endpoints
- ✅ Migración SQL para crear la tabla `leads`

### Frontend
- ✅ Página `Leads.jsx` con interfaz completa
- ✅ Tabla con filtros y acciones
- ✅ Modal para crear/editar/ver leads
- ✅ Botones para convertir a cliente
- ✅ Estadísticas en tiempo real
- ✅ Menú de navegación actualizado

---

## 📋 Paso a Paso para Activar el CRM

### 1. Aplicar la Migración de Base de Datos

Necesitas ejecutar la migración SQL para crear la tabla `leads`.

#### Opción A: Usando psql (recomendado)

```bash
# Encuentra el path de psql en tu sistema
which psql

# Si no lo encuentra, prueba con:
/Library/PostgreSQL/15/bin/psql

# Ejecuta la migración
psql -U postgres -d intra_media_system -f database/migrations/002_create_leads_table.sql
```

#### Opción B: Conectarte manualmente

```bash
# Conéctate a la base de datos
psql -U postgres -d intra_media_system

# Dentro de psql, copia y pega el contenido del archivo:
# database/migrations/002_create_leads_table.sql

# O importa el archivo directamente:
\i database/migrations/002_create_leads_table.sql

# Verifica que la tabla se creó:
\dt

# Deberías ver la tabla "leads" en el listado
```

#### Opción C: Si usas TablePlus o algún cliente gráfico

1. Abre TablePlus o tu cliente favorito
2. Conéctate a la base de datos `intra_media_system`
3. Abre el archivo `database/migrations/002_create_leads_table.sql`
4. Ejecuta todo el contenido

### 2. Verificar que la migración funcionó

```bash
psql -U postgres -d intra_media_system -c "\d leads"
```

Deberías ver la estructura de la tabla con todas las columnas.

### 3. Reiniciar el backend (si está corriendo)

```bash
# Si usas nodemon, debería reiniciarse automáticamente
# Si no, detén y reinicia:
cd backend
npm run dev
```

### 4. Acceder al CRM

1. Abre tu navegador en `http://localhost:5174` (o el puerto que uses)
2. Inicia sesión
3. En el menú lateral, ve a **Gestión → Leads (CRM)**

---

## 🚀 Funcionalidades Disponibles

### 1. Ver Todos los Leads
- Tabla con información completa
- Filtrar por estado (nuevo, contactado, propuesta, ganado, perdido)
- Estadísticas en tiempo real

### 2. Crear Nuevo Lead
- Formulario completo con:
  - Datos de contacto (nombre, email, teléfono, empresa)
  - Información del evento (tipo, fecha, ciudad, presupuesto, invitados)
  - Notas adicionales

### 3. Gestionar Leads
- **Ver detalles**: Click en el ícono de ojo
- **Editar**: Click en el ícono de lápiz
- **Convertir a cliente**: Click en el ícono de check ✅
- **Marcar como perdido**: Click en el ícono de X ❌
- **Eliminar**: Click en el ícono de basurero

### 4. Convertir Lead a Cliente
- Automáticamente crea un nuevo cliente con los datos del lead
- Marca el lead como "ganado"
- Registra la fecha de conversión

---

## 📊 Estados de un Lead

1. **Nuevo**: Lead recién ingresado
2. **Contactado**: Ya hiciste primer contacto
3. **Propuesta**: Enviaste cotización/propuesta
4. **Ganado**: Se convirtió en cliente 🎉
5. **Perdido**: No se concretó

---

## 🎯 Flujo de Trabajo Recomendado

```
📥 LEAD NUEVO (formulario web)
    ↓
👋 CONTACTADO (llamada/email)
    ↓
💰 PROPUESTA (cotización)
    ↓
    ├─ ✅ GANADO → Convertir a Cliente
    └─ ❌ PERDIDO → Marcar razón
```

---

## 🔌 Endpoints de la API

### Públicos (sin autenticación)
```
POST   /api/leads/public
```

### Protegidos (requieren token)
```
GET    /api/leads                    # Listar todos
GET    /api/leads/by-estado          # Por estado (Kanban)
GET    /api/leads/stats              # Estadísticas
GET    /api/leads/:id                # Ver uno
POST   /api/leads                    # Crear
PUT    /api/leads/:id                # Actualizar
DELETE /api/leads/:id                # Eliminar
PATCH  /api/leads/:id/estado         # Cambiar estado
POST   /api/leads/:id/nota           # Agregar nota
POST   /api/leads/:id/convert-to-cliente  # Convertir
POST   /api/leads/:id/mark-as-perdido     # Marcar perdido
```

---

## 🧪 Prueba Rápida (Testing)

### Crear un lead de prueba

```bash
# Usando curl (reemplaza el token)
curl -X POST http://localhost:3000/api/leads \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+34 600 123 456",
    "empresa": "Eventos ABC",
    "tipo_evento": "Boda",
    "fecha_evento": "2025-12-25",
    "ciudad": "Madrid",
    "presupuesto_estimado": 3000,
    "num_invitados": 150,
    "notas": "Lead de prueba"
  }'
```

### Obtener estadísticas

```bash
curl http://localhost:3000/api/leads/stats \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🎨 Próximas Mejoras (Fase 2)

Si quieres expandir el CRM básico:

### Corto Plazo (1-2 semanas)
- [ ] Formulario público embebible para captar leads desde tu web
- [ ] Email automático cuando llega un lead nuevo
- [ ] Seguimientos/recordatorios automáticos
- [ ] Historial de interacciones

### Medio Plazo (1-2 meses)
- [ ] Vista Kanban drag & drop
- [ ] Lead scoring automático
- [ ] Templates de emails
- [ ] Integración con WhatsApp

### Largo Plazo (3+ meses)
- [ ] Workflows automáticos
- [ ] IA para recomendaciones
- [ ] Analytics avanzado
- [ ] Predicción de conversión

---

## 🐛 Troubleshooting

### Error: "tabla leads no existe"
→ No has ejecutado la migración. Ve al paso 1.

### Error: "Cannot GET /api/leads"
→ El backend no está corriendo o las rutas no se registraron.
→ Revisa `backend/src/server.js` línea 109

### No veo el menú "Leads (CRM)"
→ El frontend no se actualizó.
→ Recarga la página con Ctrl+Shift+R (hard refresh)

### Los leads no aparecen
→ Abre la consola del navegador (F12) y revisa errores
→ Verifica que el backend esté corriendo en http://localhost:3000

---

## ✅ Checklist Final

Antes de usar el CRM, verifica:

- [ ] ✅ Migración SQL ejecutada
- [ ] ✅ Backend corriendo (puerto 3000)
- [ ] ✅ Frontend corriendo (puerto 5174)
- [ ] ✅ Puedes ver el menú "Gestión → Leads (CRM)"
- [ ] ✅ La página de Leads carga correctamente
- [ ] ✅ Puedes crear un lead de prueba
- [ ] ✅ Puedes ver estadísticas

---

## 🎉 ¡Listo para Usar!

Tu CRM básico está completamente funcional. Ahora puedes:
- Capturar leads
- Gestionarlos eficientemente
- Convertirlos en clientes
- Ver métricas en tiempo real

**¿Preguntas o problemas?** Revisa el troubleshooting arriba o consulta los archivos:
- `/backend/src/models/Lead.js`
- `/backend/src/controllers/leadsController.js`
- `/frontend/src/pages/Leads.jsx`
