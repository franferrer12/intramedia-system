# Guía de Middlewares - IntraMedia System

## Sistema de Paginación

### Uso Básico

```javascript
import { paginationMiddleware, formatPaginatedResponse } from '../middleware/pagination.js';
import db from '../config/database.js';

// En tu ruta
router.get('/djs', paginationMiddleware, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    // Query con paginación
    const result = await db.query(
      `SELECT * FROM djs ORDER BY nombre LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Obtener total
    const totalResult = await db.query(`SELECT COUNT(*) FROM djs`);
    const total = parseInt(totalResult.rows[0].count);

    // Formatear respuesta
    res.json(formatPaginatedResponse(
      result.rows,
      total,
      req.pagination
    ));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Respuesta de Ejemplo

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

### Uso con Filtros

```javascript
import { parseFilters, buildWhereClause, buildOrderByClause } from '../middleware/pagination.js';

router.get('/eventos', paginationMiddleware, async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const params = [];

    // Construir WHERE dinámicamente
    const whereClause = buildWhereClause(filters, params);
    const orderClause = buildOrderByClause(filters, 'fecha DESC');

    const query = `
      SELECT * FROM eventos
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(req.pagination.limit, req.pagination.offset);

    const result = await db.query(query, params);

    // Count con mismos filtros
    const countQuery = `SELECT COUNT(*) FROM eventos ${whereClause}`;
    const totalResult = await db.query(countQuery, params.slice(0, -2));

    res.json(formatPaginatedResponse(
      result.rows,
      parseInt(totalResult.rows[0].count),
      req.pagination
    ));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Query Params Soportados

- `page` - Número de página (default: 1)
- `limit` - Registros por página (default: 20, max: 100)
- `search` - Búsqueda de texto
- `dateFrom` - Filtro fecha desde
- `dateTo` - Filtro fecha hasta
- `status` - Filtro por estado
- `type` - Filtro por tipo
- `sortBy` - Campo para ordenar
- `sortOrder` - Dirección: asc o desc

Ejemplo:
```
GET /api/eventos?page=2&limit=10&status=confirmado&sortBy=fecha&sortOrder=desc
```

---

## Sistema de Validación

### Uso Básico

```javascript
import { field, validate } from '../middleware/validation.js';

router.post('/djs',
  validate([
    field('nombre', 'Nombre').required().minLength(3).maxLength(100),
    field('email', 'Email').required().email(),
    field('telefono', 'Teléfono').optional().phone(),
    field('cache_minimo', 'Caché mínimo').optional().numeric().positive()
  ]),
  async (req, res) => {
    // Si llegamos aquí, los datos están validados
    const { nombre, email, telefono, cache_minimo } = req.body;
    // ... crear DJ
  }
);
```

### Validadores Disponibles

#### Validación de Existencia
```javascript
field('nombre').required()           // Campo requerido
field('bio').optional()               // Campo opcional
```

#### Validación de Tipo
```javascript
field('email').email()                // Email válido
field('telefono').phone()             // Teléfono válido
field('website').url()                // URL válida
field('fecha_nacimiento').date()      // Fecha válida
field('edad').numeric()               // Número
field('cantidad').integer()           // Entero
field('precio').positive()            // Número positivo
```

#### Validación de Longitud
```javascript
field('nombre').minLength(3)          // Mínimo 3 caracteres
field('nombre').maxLength(100)        // Máximo 100 caracteres
field('edad').min(18)                 // Valor mínimo
field('cache').max(10000)             // Valor máximo
```

#### Validación de Valores
```javascript
field('status').isIn(['activo', 'inactivo', 'pendiente'])
field('codigo').matches(/^[A-Z]{3}-\d{3}$/)
```

#### Validación Custom
```javascript
field('password').custom(
  (value) => value.length >= 8 && /[A-Z]/.test(value),
  'La contraseña debe tener al menos 8 caracteres y una mayúscula'
)
```

### Ejemplo Completo: Crear Evento

```javascript
router.post('/eventos',
  validate([
    field('titulo', 'Título').required().minLength(5).maxLength(200),
    field('fecha', 'Fecha').required().date(),
    field('cliente_id', 'Cliente').required().integer().positive(),
    field('dj_id', 'DJ').required().integer().positive(),
    field('cache_total', 'Caché total').required().numeric().positive(),
    field('duracion_horas', 'Duración').optional().integer().min(1).max(24),
    field('tipo_evento', 'Tipo de evento').required().isIn(['boda', 'corporativo', 'privado', 'club']),
    field('observaciones', 'Observaciones').optional().maxLength(500)
  ]),
  async (req, res) => {
    try {
      const evento = await crearEvento(req.body);
      res.json({ success: true, data: evento });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
```

### Respuesta de Error de Validación

```json
{
  "success": false,
  "error": "Errores de validación",
  "errors": {
    "titulo": "Título debe tener al menos 5 caracteres",
    "email": "Email debe ser un email válido",
    "cache_total": "Caché total es requerido"
  }
}
```

---

## Sanitización

Limpia y formatea datos antes de procesarlos:

```javascript
import { sanitize, sanitizeRequest } from '../middleware/validation.js';

router.post('/usuarios',
  sanitizeRequest({
    nombre: sanitize.trim,
    email: (val) => sanitize.lowercase(sanitize.trim(val)),
    telefono: sanitize.removeSpaces,
    bio: sanitize.escape
  }),
  validate([...]),
  async (req, res) => {
    // Datos ya sanitizados
  }
);
```

### Sanitizers Disponibles

```javascript
sanitize.trim(value)           // Elimina espacios al inicio/fin
sanitize.lowercase(value)       // Convierte a minúsculas
sanitize.uppercase(value)       // Convierte a mayúsculas
sanitize.escape(value)          // Escapa HTML
sanitize.removeSpaces(value)    // Elimina todos los espacios
sanitize.toNumber(value)        // Convierte a número
sanitize.toBoolean(value)       // Convierte a boolean
```

---

## Ejemplo Completo: Controller con Todo

```javascript
import { paginationMiddleware, formatPaginatedResponse, parseFilters, buildWhereClause } from '../middleware/pagination.js';
import { field, validate, sanitizeRequest, sanitize } from '../middleware/validation.js';
import db from '../config/database.js';

// GET /api/clientes - Lista con paginación y filtros
export const getClientes = [
  paginationMiddleware,
  async (req, res) => {
    try {
      const filters = parseFilters(req.query);
      const params = [];
      const whereClause = buildWhereClause(filters, params);

      const query = `
        SELECT * FROM clientes
        ${whereClause}
        ORDER BY nombre
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      params.push(req.pagination.limit, req.pagination.offset);

      const result = await db.query(query, params);
      const countResult = await db.query(`SELECT COUNT(*) FROM clientes ${whereClause}`, params.slice(0, -2));

      res.json(formatPaginatedResponse(
        result.rows,
        parseInt(countResult.rows[0].count),
        req.pagination
      ));
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
];

// POST /api/clientes - Crear con validación
export const createCliente = [
  sanitizeRequest({
    nombre: sanitize.trim,
    email: (val) => sanitize.lowercase(sanitize.trim(val)),
    telefono: sanitize.removeSpaces
  }),
  validate([
    field('nombre', 'Nombre').required().minLength(3).maxLength(100),
    field('email', 'Email').required().email(),
    field('telefono', 'Teléfono').required().phone(),
    field('empresa', 'Empresa').optional().maxLength(100),
    field('tipo_cliente', 'Tipo de cliente').required().isIn(['particular', 'empresa', 'agencia'])
  ]),
  async (req, res) => {
    try {
      const { nombre, email, telefono, empresa, tipo_cliente } = req.body;

      const result = await db.query(
        `INSERT INTO clientes (nombre, email, telefono, empresa, tipo_cliente)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [nombre, email, telefono, empresa, tipo_cliente]
      );

      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
];
```

---

## Testing

### Test de Paginación

```bash
# Página 1, 10 resultados
curl "http://localhost:3001/api/djs?page=1&limit=10"

# Con filtros
curl "http://localhost:3001/api/eventos?status=confirmado&dateFrom=2025-01-01&sortBy=fecha&sortOrder=desc"
```

### Test de Validación

```bash
# Datos válidos
curl -X POST http://localhost:3001/api/djs \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "DJ Test",
    "email": "test@example.com",
    "telefono": "+34123456789"
  }'

# Datos inválidos (email mal formato)
curl -X POST http://localhost:3001/api/djs \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "DJ",
    "email": "invalid-email",
    "telefono": "123"
  }'
```

---

## Beneficios

### Paginación
- ✅ Performance mejorado - No cargas todos los datos
- ✅ Respuestas consistentes en toda la API
- ✅ Metadata útil (totalPages, hasNextPage, etc.)
- ✅ Filtros y ordenamiento estandarizados

### Validación
- ✅ Datos validados antes de procesarlos
- ✅ Mensajes de error claros y consistentes
- ✅ Previene errores de DB y lógica
- ✅ Código más limpio y mantenible
- ✅ Sin dependencias externas
