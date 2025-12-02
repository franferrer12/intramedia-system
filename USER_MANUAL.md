# 📖 Manual de Usuario
## Intra Media System - Guía Completa

**Versión:** 2.3.0
**Fecha:** Diciembre 2025

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Gestión de Eventos](#gestión-de-eventos)
4. [Gestión de DJs](#gestión-de-djs)
5. [Gestión de Clientes](#gestión-de-clientes)
6. [Pipeline de Leads](#pipeline-de-leads)
7. [Calendario](#calendario)
8. [Pagos y Facturación](#pagos-y-facturación)
9. [Documentos](#documentos)
10. [Dashboard Financiero](#dashboard-financiero)
11. [Atajos de Teclado](#atajos-de-teclado)
12. [FAQ](#faq)

---

## 🎯 Introducción

Intra Media System es un sistema integral de gestión diseñado específicamente para agencias de DJs. Te permite gestionar eventos, DJs, clientes, pagos y mucho más desde una única plataforma.

### Características Principales

✅ **Gestión de Eventos** - Crea, edita y gestiona todos tus eventos
✅ **Gestión de DJs** - Administra tu roster de DJs y sus comisiones
✅ **Gestión de Clientes** - Base de datos completa de clientes
✅ **Pipeline de Leads** - Convierte leads en eventos confirmados
✅ **Calendario** - Vista de calendario con sincronización Google Calendar
✅ **Pagos con Stripe** - Acepta pagos online de forma segura
✅ **Documentos** - Gestión de contratos y documentos con versionado
✅ **Dashboard Financiero** - Visualiza tus ingresos y comisiones
✅ **Notificaciones** - Mantente al día con notificaciones en tiempo real
✅ **Sistema de Reservas** - Formulario público para reservas online

---

## 🚀 Primeros Pasos

### Inicio de Sesión

1. Accede a `http://localhost:5173` (desarrollo) o tu URL de producción
2. Ingresa tu email y contraseña
3. Haz clic en "Iniciar Sesión"

**Credenciales por defecto:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Importante:** Cambia tu contraseña después del primer inicio de sesión.

### Dashboard Principal

Al iniciar sesión verás el dashboard con:

- **KPIs:** Ingresos totales, eventos confirmados, DJs activos, etc.
- **Eventos Próximos:** Lista de próximos eventos
- **Gráficos:** Visualización de ingresos mensuales
- **Acciones Rápidas:** Botones para crear eventos, leads, etc.

---

## 📅 Gestión de Eventos

### Crear Nuevo Evento

1. Ve a **"Eventos"** en el menú lateral
2. Haz clic en **"Nuevo Evento"**
3. Completa el formulario:
   - **Nombre del Evento:** Ej. "Boda María & Carlos"
   - **Fecha y Hora:** Selecciona fecha y hora del evento
   - **Ubicación:** Dirección completa del evento
   - **DJ:** Selecciona el DJ asignado
   - **Cliente:** Selecciona o crea cliente
   - **Precio Acordado:** Precio total del evento
   - **Duración:** Duración en minutos (default: 300min = 5 horas)
   - **Comisiones:** Se calculan automáticamente basadas en % configurado
4. Haz clic en **"Crear Evento"**

**Atajo:** Presiona `Ctrl+N` para crear nuevo evento rápidamente

### Editar Evento

1. En la lista de eventos, haz clic en el icono de editar ✏️
2. Modifica los campos necesarios
3. Haz clic en **"Guardar Cambios"**

### Estados de Eventos

- 🟡 **Pendiente:** Evento creado pero no confirmado
- 🟢 **Confirmado:** Evento confirmado con cliente
- ✅ **Completado:** Evento realizado
- 🔴 **Cancelado:** Evento cancelado

### Filtrar Eventos

Usa los filtros en la parte superior:
- **Fecha:** Rango de fechas
- **Estado:** Filtra por estado
- **DJ:** Ver eventos de un DJ específico
- **Cliente:** Ver eventos de un cliente
- **Búsqueda:** Busca por nombre de evento

---

## 🎧 Gestión de DJs

### Agregar Nuevo DJ

1. Ve a **"DJs"** en el menú lateral
2. Haz clic en **"Nuevo DJ"**
3. Completa el formulario:
   - **Nombre Real:** Nombre completo
   - **Nombre Artístico:** Nombre profesional
   - **Email:** Email de contacto
   - **Teléfono:** Número de teléfono
   - **Especialidad:** Género musical (House, Techno, etc.)
   - **Comisión Predeterminada:** % de comisión (ej. 70%)
   - **Precio por Hora:** Tarifa por hora
   - **IBAN:** Para transferencias bancarias
   - **NIF/CIF:** Información fiscal
4. Haz clic en **"Crear DJ"**

### Métricas de DJ

Ve a **"DJs"** > **"Métricas"** para ver:
- Ingresos totales por DJ
- Número de eventos
- Tasa de satisfacción
- Disponibilidad

### Pagos Pendientes

Ve a **"DJs"** > **"Pagos Pendientes"** para:
- Ver comisiones pendientes de pago
- Registrar pagos realizados
- Generar reportes de pagos

---

## 👥 Gestión de Clientes

### Agregar Nuevo Cliente

1. Ve a **"Clientes"** en el menú lateral
2. Haz clic en **"Nuevo Cliente"**
3. Completa el formulario:
   - **Nombre:** Nombre completo
   - **Email:** Email de contacto
   - **Teléfono:** Número de teléfono
   - **Tipo:** Individual / Empresa / Organizador
   - **Empresa:** Nombre de empresa (si aplica)
   - **Dirección:** Dirección física
   - **NIF/CIF:** Información fiscal
   - **Notas:** Información adicional
4. Haz clic en **"Crear Cliente"**

### Historial de Cliente

Haz clic en un cliente para ver:
- Eventos pasados
- Eventos próximos
- Total gastado
- Documentos asociados
- Pagos realizados

---

## 🎯 Pipeline de Leads

### Crear Nuevo Lead

1. Ve a **"Leads"** en el menú lateral
2. Haz clic en **"Nuevo Lead"**
3. Completa información básica:
   - **Nombre:** Nombre del prospecto
   - **Email y Teléfono:** Datos de contacto
   - **Origen:** Web, referido, redes sociales, etc.
   - **Valor Estimado:** Valor potencial del negocio
   - **Asignar a:** Usuario responsable
   - **Próximo Seguimiento:** Fecha de seguimiento
4. Haz clic en **"Crear Lead"**

### Etapas del Pipeline

Arrastra y suelta leads entre etapas:

1. 🆕 **Nuevo:** Lead recién creado
2. 📞 **Contactado:** Primera comunicación realizada
3. ✅ **Calificado:** Lead calificado como viable
4. 📄 **Propuesta:** Propuesta enviada
5. 💰 **Negociación:** En proceso de negociación
6. 🎉 **Ganado:** Convertido en cliente/evento
7. ❌ **Perdido:** No se concretó

### Convertir Lead en Evento

1. Arrastra el lead a **"Ganado"**
2. Haz clic en **"Convertir a Evento"**
3. El sistema crea automáticamente:
   - Cliente nuevo (si no existe)
   - Evento con datos del lead
   - Enlaza todo correctamente

---

## 📆 Calendario

### Vista de Calendario

1. Ve a **"Calendario"** en el menú lateral
2. Vistas disponibles:
   - **Mes:** Vista mensual
   - **Semana:** Vista semanal
   - **Día:** Vista diaria
   - **Agenda:** Lista cronológica

### Sincronización con Google Calendar

1. Ve a **"Configuración"** > **"Calendario"**
2. Haz clic en **"Conectar Google Calendar"**
3. Autoriza la conexión
4. Configura sincronización:
   - **Dirección:** Importar / Exportar / Bidireccional
   - **Auto-sync:** Activar sincronización automática
   - **Intervalo:** Cada 15 minutos (recomendado)
5. Haz clic en **"Guardar"**

### Resolver Conflictos

Si hay conflictos entre calendarios:
1. Ve a **"Calendario"** > **"Conflictos"**
2. Selecciona estrategia:
   - **Local Gana:** Mantener datos del sistema
   - **Google Gana:** Mantener datos de Google
   - **Fusionar:** Combinar ambos
3. Haz clic en **"Resolver"**

---

## 💳 Pagos y Facturación

### Crear Pago con Stripe

1. Ve al evento correspondiente
2. Haz clic en **"Solicitar Pago"**
3. Completa:
   - **Monto:** Cantidad a cobrar
   - **Tipo:** Anticipo / Pago Final / Reembolso
   - **Descripción:** Concepto del pago
4. Sistema genera link de pago
5. Comparte link con cliente
6. Cliente paga con tarjeta de forma segura

### Registrar Pago Manual

Para pagos en efectivo o transferencia:
1. Ve a **"Pagos"** > **"Nuevo Pago"**
2. Completa formulario:
   - **Evento:** Selecciona evento
   - **Monto:** Cantidad recibida
   - **Método:** Efectivo / Transferencia
   - **Tipo:** Anticipo / Final
3. Haz clic en **"Registrar"**

### Reembolsos

1. Ve a **"Pagos"**
2. Encuentra el pago a reembolsar
3. Haz clic en **"Reembolsar"**
4. Confirma el reembolso
5. Si fue con Stripe, se procesa automáticamente

---

## 📄 Documentos

### Subir Documento

1. Ve a la sección correspondiente (Evento, DJ, o Cliente)
2. Haz clic en **"Documentos"**
3. Haz clic en **"Subir Documento"**
4. Selecciona archivo (PDF, Word, Excel, imágenes)
5. Selecciona tipo:
   - **Contrato:** Contratos firmados
   - **Factura:** Facturas emitidas
   - **Recibo:** Recibos de pago
   - **Otro:** Otros documentos
6. Haz clic en **"Subir"**

### Control de Versiones

- El sistema mantiene todas las versiones de documentos
- Solo la última versión está marcada como "actual"
- Puedes ver historial completo en **"Ver Versiones"**

### Descargar Documento

1. Ve a **"Documentos"**
2. Encuentra el documento
3. Haz clic en icono de descarga 📥
4. El archivo se descarga automáticamente

---

## 💰 Dashboard Financiero

### Vista General

Ve a **"Financial"** para ver:

- **Ingresos Totales:** Total de ingresos del período
- **Comisiones Agencia:** Total de comisiones de la agencia
- **Comisiones DJs:** Total pagado a DJs
- **Eventos Confirmados:** Número de eventos confirmados
- **Tasa de Conversión:** % de leads convertidos

### Gráficos

**Ingresos Mensuales:**
- Visualización de ingresos por mes
- Comparación año anterior
- Tendencia de crecimiento

**Performance por DJ:**
- Ranking de DJs por ingresos
- Número de eventos por DJ
- Comisiones generadas

### Reportes

1. Ve a **"Financial"** > **"Reportes"**
2. Selecciona rango de fechas
3. Elige tipo de reporte:
   - Ingresos por DJ
   - Ingresos por cliente
   - Ingresos por mes
   - Pagos pendientes
4. Haz clic en **"Generar"**
5. Exporta a Excel o PDF

---

## ⌨️ Atajos de Teclado

### Navegación Global

| Atajo | Acción |
|-------|--------|
| `Alt + H` | Ir a Dashboard |
| `Alt + E` | Ir a Eventos |
| `Alt + D` | Ir a DJs |
| `Alt + C` | Ir a Clientes |
| `Alt + L` | Ir a Leads |
| `Alt + F` | Ir a Financial |
| `Alt + K` | Ir a Calendario |
| `Alt + S` | Ir a Configuración |

### Acciones

| Atajo | Acción |
|-------|--------|
| `Ctrl + K` | Abrir paleta de comandos |
| `Ctrl + S` | Guardar formulario |
| `Ctrl + /` | Mostrar atajos de teclado |
| `Escape` | Cerrar modal o cancelar |

### Tablas

| Atajo | Acción |
|-------|--------|
| `↑` `↓` | Navegar entre filas |
| `Enter` | Abrir/Seleccionar elemento |
| `Space` | Marcar checkbox |

**Tip:** Presiona `Ctrl + /` en cualquier momento para ver todos los atajos disponibles.

---

## ❓ FAQ (Preguntas Frecuentes)

### General

**Q: ¿Cómo recupero mi contraseña?**
A: Haz clic en "¿Olvidaste tu contraseña?" en la página de login. Recibirás un email con instrucciones.

**Q: ¿Puedo acceder desde mi móvil?**
A: Sí, la aplicación es totalmente responsive y funciona en dispositivos móviles.

**Q: ¿Los datos están seguros?**
A: Sí, usamos encriptación SSL/TLS, almacenamiento seguro y backups automáticos diarios.

### Eventos

**Q: ¿Puedo duplicar un evento?**
A: Sí, haz clic en el menú ⋯ del evento y selecciona "Duplicar".

**Q: ¿Cómo cancelo un evento?**
A: Edita el evento y cambia el estado a "Cancelado". Los pagos realizados quedan registrados.

**Q: ¿Puedo asignar múltiples DJs a un evento?**
A: Actualmente solo se puede asignar un DJ principal. Para eventos con múltiples DJs, crea eventos separados.

### DJs

**Q: ¿Cómo veo la disponibilidad de un DJ?**
A: Ve a "Calendario" y filtra por el DJ específico.

**Q: ¿Puedo cambiar la comisión de un DJ por evento?**
A: Sí, al crear/editar el evento puedes ajustar las comisiones manualmente.

**Q: ¿Cómo desactivo un DJ?**
A: Edita el DJ y desmarca "Activo". El DJ no aparecerá en listados pero mantiene su historial.

### Pagos

**Q: ¿Qué comisión cobra Stripe?**
A: Stripe cobra aproximadamente 1.4% + 0.25€ por transacción en Europa.

**Q: ¿Cuánto tarda un reembolso?**
A: Los reembolsos de Stripe tardan 5-10 días hábiles en reflejarse en la tarjeta del cliente.

**Q: ¿Puedo facturar sin Stripe?**
A: Sí, puedes registrar pagos manuales (efectivo, transferencia) sin usar Stripe.

### Calendario

**Q: ¿La sincronización con Google Calendar es en tiempo real?**
A: La sincronización ocurre cada 15 minutos por defecto. Puedes cambiar el intervalo o sincronizar manualmente.

**Q: ¿Qué pasa si modifico un evento en Google Calendar?**
A: En la próxima sincronización, el sistema detectará el cambio y te pedirá resolver el conflicto.

### Técnico

**Q: ¿Cómo exporto mis datos?**
A: Ve a "Configuración" > "Exportar Datos". Puedes exportar a Excel o CSV.

**Q: ¿Hay límite de almacenamiento para documentos?**
A: Cada archivo puede ser hasta 10MB. No hay límite en cantidad de archivos.

**Q: ¿Puedo integrar con otras herramientas?**
A: Actualmente soportamos Google Calendar y Stripe. Más integraciones en desarrollo.

---

## 📞 Soporte

### Contacto

- **Email:** support@intramedia.com
- **Teléfono:** +34 900 123 456
- **Horario:** Lunes a Viernes, 9:00 - 18:00 CET

### Recursos Adicionales

- [API Documentation](./API_DOCUMENTATION.md)
- [Performance Guide](./PERFORMANCE_OPTIMIZATION.md)
- [UI/UX Guide](./UI_UX_GUIDE.md)

### Reportar un Error

1. Captura pantalla del error
2. Anota los pasos para reproducir
3. Envía email a support@intramedia.com con:
   - Descripción del error
   - Captura de pantalla
   - Pasos para reproducir
   - Navegador y versión

---

## 🎓 Videos Tutoriales

**Próximamente:**
- Tutorial de configuración inicial
- Cómo gestionar eventos
- Configurar pagos con Stripe
- Sincronización con Google Calendar
- Dashboard financiero

---

**Última Actualización:** Diciembre 2025
**Versión:** 2.3.0
**Mantenido por:** Intra Media Team
