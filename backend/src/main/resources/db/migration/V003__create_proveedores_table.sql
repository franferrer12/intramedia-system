-- V003: Actualización de tabla proveedores
-- Nota: La tabla proveedores ya fue creada en V001, aquí solo se añaden columnas y datos

-- Añadir columnas adicionales si no existen
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_proveedores_tipo ON proveedores(tipo);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);

-- Datos de ejemplo (solo si no existen)
INSERT INTO proveedores (nombre, contacto, telefono, email, activo, tipo, direccion)
SELECT 'Distribuidora Bebidas Premium', 'Juan García', '+34 600 123 456', 'contacto@bebidaspremium.es', true, 'BEBIDAS', 'Calle Example 123'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Distribuidora Bebidas Premium');

INSERT INTO proveedores (nombre, contacto, telefono, email, activo, tipo, direccion)
SELECT 'Catering Gourmet', 'María López', '+34 600 234 567', 'info@cateringgourmet.es', true, 'ALIMENTOS', 'Av. Test 456'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Catering Gourmet');

INSERT INTO proveedores (nombre, contacto, telefono, email, activo, tipo, direccion)
SELECT 'Sonido y Luz Pro', 'Carlos Martínez', '+34 600 345 678', 'ventas@sonidoluzpro.es', true, 'EQUIPAMIENTO', 'Plaza Demo 789'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Sonido y Luz Pro');
