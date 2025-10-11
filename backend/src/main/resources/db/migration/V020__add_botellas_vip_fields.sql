-- =====================================================
-- Migración V020: Agregar campos para Botellas VIP
-- =====================================================
-- Fecha: 11 Octubre 2025
-- Descripción: Agrega campos a la tabla productos para soportar
--              venta dual (botella completa vs copas individuales)
--              con precios diferenciados y tracking de capacidad.
-- =====================================================

-- Agregar nuevas columnas a la tabla productos
ALTER TABLE productos
    ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(20) DEFAULT 'UNIDAD',
    ADD COLUMN IF NOT EXISTS capacidad_ml INTEGER,
    ADD COLUMN IF NOT EXISTS copas_por_botella INTEGER,
    ADD COLUMN IF NOT EXISTS precio_copa DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS precio_botella_vip DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS es_botella BOOLEAN DEFAULT FALSE;

-- Agregar comentarios para documentación
COMMENT ON COLUMN productos.unidad_medida IS 'Unidad de medida del producto: UNIDAD, BOTELLA, LITRO, COPA';
COMMENT ON COLUMN productos.capacidad_ml IS 'Capacidad en mililitros (para botellas)';
COMMENT ON COLUMN productos.copas_por_botella IS 'Número de copas que se pueden servir de una botella';
COMMENT ON COLUMN productos.precio_copa IS 'Precio de venta por copa individual';
COMMENT ON COLUMN productos.precio_botella_vip IS 'Precio de venta de botella completa en pack VIP (con descuento)';
COMMENT ON COLUMN productos.es_botella IS 'Indica si el producto se vende como botella con copas';

-- Crear índice para búsquedas por tipo de producto
CREATE INDEX IF NOT EXISTS idx_productos_es_botella ON productos(es_botella);
CREATE INDEX IF NOT EXISTS idx_productos_unidad_medida ON productos(unidad_medida);

-- Agregar constraint para validar unidad de medida
ALTER TABLE productos
    ADD CONSTRAINT chk_unidad_medida
    CHECK (unidad_medida IN ('UNIDAD', 'BOTELLA', 'LITRO', 'COPA'));

-- Validación: Si es_botella = true, debe tener capacidad y copas por botella
ALTER TABLE productos
    ADD CONSTRAINT chk_botella_config
    CHECK (
        (es_botella = FALSE) OR
        (es_botella = TRUE AND capacidad_ml IS NOT NULL AND copas_por_botella IS NOT NULL)
    );

-- =====================================================
-- Datos de ejemplo: Configurar productos existentes como botellas
-- =====================================================

-- Actualizar productos existentes que son botellas de alcohol
-- (Ajustar según tus productos reales en la BD)

-- Vodka
UPDATE productos
SET es_botella = TRUE,
    unidad_medida = 'BOTELLA',
    capacidad_ml = 750,
    copas_por_botella = 25,
    precio_copa = 8.00,
    precio_botella_vip = 80.00
WHERE LOWER(nombre) LIKE '%vodka%'
  AND es_botella = FALSE;

-- Gin/Ginebra
UPDATE productos
SET es_botella = TRUE,
    unidad_medida = 'BOTELLA',
    capacidad_ml = 700,
    copas_por_botella = 23,
    precio_copa = 9.00,
    precio_botella_vip = 85.00
WHERE LOWER(nombre) LIKE '%gin%'
   OR LOWER(nombre) LIKE '%ginebra%'
  AND es_botella = FALSE;

-- Ron
UPDATE productos
SET es_botella = TRUE,
    unidad_medida = 'BOTELLA',
    capacidad_ml = 750,
    copas_por_botella = 25,
    precio_copa = 7.50,
    precio_botella_vip = 75.00
WHERE LOWER(nombre) LIKE '%ron%'
  AND es_botella = FALSE;

-- Whisky
UPDATE productos
SET es_botella = TRUE,
    unidad_medida = 'BOTELLA',
    capacidad_ml = 700,
    copas_por_botella = 23,
    precio_copa = 10.00,
    precio_botella_vip = 95.00
WHERE LOWER(nombre) LIKE '%whisky%'
   OR LOWER(nombre) LIKE '%whiskey%'
  AND es_botella = FALSE;

-- Tequila
UPDATE productos
SET es_botella = TRUE,
    unidad_medida = 'BOTELLA',
    capacidad_ml = 750,
    copas_por_botella = 25,
    precio_copa = 8.50,
    precio_botella_vip = 85.00
WHERE LOWER(nombre) LIKE '%tequila%'
  AND es_botella = FALSE;

-- Brandy/Cognac
UPDATE productos
SET es_botella = TRUE,
    unidad_medida = 'BOTELLA',
    capacidad_ml = 700,
    copas_por_botella = 23,
    precio_copa = 11.00,
    precio_botella_vip = 100.00
WHERE (LOWER(nombre) LIKE '%brandy%' OR LOWER(nombre) LIKE '%cognac%')
  AND es_botella = FALSE;

-- Champagne/Cava
UPDATE productos
SET es_botella = TRUE,
    unidad_medida = 'BOTELLA',
    capacidad_ml = 750,
    copas_por_botella = 6,  -- Copas más grandes
    precio_copa = 12.00,
    precio_botella_vip = 60.00
WHERE (LOWER(nombre) LIKE '%champagne%' OR LOWER(nombre) LIKE '%cava%')
  AND es_botella = FALSE;

-- =====================================================
-- Verificación de la migración
-- =====================================================

-- Contar productos configurados como botellas
DO $$
DECLARE
    total_botellas INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_botellas FROM productos WHERE es_botella = TRUE;
    RAISE NOTICE 'Migración V020 completada: % productos configurados como botellas', total_botellas;
END $$;
