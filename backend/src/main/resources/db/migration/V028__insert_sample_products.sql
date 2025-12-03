-- Migración V028: Insertar productos de ejemplo para el sistema POS
-- Productos realistas para un club de ocio nocturno

-- ============================================================
-- BEBIDAS ALCOHÓLICAS - SERVICIO EN COPA (90ml, 10% merma)
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo, capacidad_ml, tipo_venta, ml_por_servicio, factor_merma)
VALUES
    -- GIN & VODKA (Premium spirits)
    ('BEB-001', 'Ginebra Bombay Sapphire', 'Ginebra premium 1L para gin-tonic', 'Bebidas Alcohólicas', 'BOTELLA', 18.00, 7.00, 15, 5, true, 1000, 'COPA', 90, 10),
    ('BEB-002', 'Ginebra Tanqueray', 'Ginebra clásica 1L', 'Bebidas Alcohólicas', 'BOTELLA', 20.00, 7.50, 12, 5, true, 1000, 'COPA', 90, 10),
    ('BEB-003', 'Vodka Absolut', 'Vodka sueco 1L', 'Bebidas Alcohólicas', 'BOTELLA', 15.00, 6.50, 20, 8, true, 1000, 'COPA', 90, 10),
    ('BEB-004', 'Vodka Smirnoff', 'Vodka estándar 1L', 'Bebidas Alcohólicas', 'BOTELLA', 12.00, 6.00, 18, 8, true, 1000, 'COPA', 90, 10),

    -- RON (Rum for cuba libre, mojito)
    ('BEB-005', 'Ron Havana Club 3 Años', 'Ron blanco cubano 1L', 'Bebidas Alcohólicas', 'BOTELLA', 14.00, 6.50, 20, 10, true, 1000, 'COPA', 90, 10),
    ('BEB-006', 'Ron Barceló Añejo', 'Ron añejo dominicano 1L', 'Bebidas Alcohólicas', 'BOTELLA', 16.00, 7.00, 15, 8, true, 1000, 'COPA', 90, 10),
    ('BEB-007', 'Ron Bacardí Carta Blanca', 'Ron blanco 1L', 'Bebidas Alcohólicas', 'BOTELLA', 13.00, 6.00, 22, 10, true, 1000, 'COPA', 90, 10),

    -- WHISKY (For whisky coke, on the rocks)
    ('BEB-008', 'Whisky Jack Daniels', 'Bourbon americano 1L', 'Bebidas Alcohólicas', 'BOTELLA', 25.00, 8.00, 12, 5, true, 1000, 'COPA', 90, 10),
    ('BEB-009', 'Whisky Johnnie Walker Red', 'Scotch estándar 1L', 'Bebidas Alcohólicas', 'BOTELLA', 18.00, 7.00, 15, 6, true, 1000, 'COPA', 90, 10),
    ('BEB-010', 'Whisky Ballantines', 'Scotch blended 1L', 'Bebidas Alcohólicas', 'BOTELLA', 16.00, 6.50, 18, 8, true, 1000, 'COPA', 90, 10);

-- ============================================================
-- LICORES - SERVICIO EN CHUPITO (30ml, 5% merma)
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo, capacidad_ml, tipo_venta, ml_por_servicio, factor_merma)
VALUES
    ('LIC-001', 'Jägermeister', 'Licor de hierbas alemán 700ml', 'Licores', 'BOTELLA', 14.00, 3.50, 25, 10, true, 700, 'CHUPITO', 30, 5),
    ('LIC-002', 'Tequila José Cuervo', 'Tequila silver 700ml', 'Licores', 'BOTELLA', 16.00, 4.00, 20, 8, true, 700, 'CHUPITO', 30, 5),
    ('LIC-003', 'Licor 43', 'Licor español dulce 700ml', 'Licores', 'BOTELLA', 15.00, 3.50, 15, 6, true, 700, 'CHUPITO', 30, 5),
    ('LIC-004', 'Sambuca Molinari', 'Licor de anís italiano 700ml', 'Licores', 'BOTELLA', 13.00, 3.00, 12, 5, true, 700, 'CHUPITO', 30, 5),
    ('LIC-005', 'Pacharán Zoco', 'Licor de endrinas 1L', 'Licores', 'BOTELLA', 12.00, 3.50, 18, 8, true, 1000, 'CHUPITO', 30, 5);

-- ============================================================
-- CERVEZAS - VENTA DIRECTA (BOTELLA COMPLETA)
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo, capacidad_ml, tipo_venta)
VALUES
    ('CERV-001', 'Cerveza Estrella Galicia', 'Cerveza española 330ml', 'Cervezas', 'UNIDAD', 0.80, 3.50, 150, 50, true, 330, 'BOTELLA'),
    ('CERV-002', 'Cerveza Mahou 5 Estrellas', 'Cerveza madrileña 330ml', 'Cervezas', 'UNIDAD', 0.75, 3.00, 180, 60, true, 330, 'BOTELLA'),
    ('CERV-003', 'Cerveza Heineken', 'Cerveza holandesa 330ml', 'Cervezas', 'UNIDAD', 0.90, 4.00, 120, 40, true, 330, 'BOTELLA'),
    ('CERV-004', 'Cerveza Corona Extra', 'Cerveza mexicana 355ml', 'Cervezas', 'UNIDAD', 1.20, 4.50, 100, 40, true, 355, 'BOTELLA'),
    ('CERV-005', 'Cerveza San Miguel 0,0', 'Cerveza sin alcohol 330ml', 'Cervezas', 'UNIDAD', 0.70, 3.00, 80, 30, true, 330, 'BOTELLA');

-- ============================================================
-- REFRESCOS & MIXERS - VENTA DIRECTA
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo, capacidad_ml, tipo_venta)
VALUES
    ('REF-001', 'Coca-Cola', 'Refresco cola 330ml', 'Refrescos', 'UNIDAD', 0.50, 2.50, 200, 80, true, 330, 'BOTELLA'),
    ('REF-002', 'Coca-Cola Zero', 'Refresco cola sin azúcar 330ml', 'Refrescos', 'UNIDAD', 0.50, 2.50, 150, 60, true, 330, 'BOTELLA'),
    ('REF-003', 'Fanta Naranja', 'Refresco naranja 330ml', 'Refrescos', 'UNIDAD', 0.45, 2.50, 120, 50, true, 330, 'BOTELLA'),
    ('REF-004', 'Sprite', 'Refresco lima-limón 330ml', 'Refrescos', 'UNIDAD', 0.45, 2.50, 100, 40, true, 330, 'BOTELLA'),
    ('REF-005', 'Agua Mineral Evian', 'Agua mineral 500ml', 'Refrescos', 'UNIDAD', 0.40, 2.00, 180, 70, true, 500, 'BOTELLA'),
    ('REF-006', 'Agua con Gas San Pellegrino', 'Agua con gas 500ml', 'Refrescos', 'UNIDAD', 0.60, 2.50, 100, 40, true, 500, 'BOTELLA'),
    ('REF-007', 'Tónica Schweppes', 'Tónica premium 200ml', 'Refrescos', 'UNIDAD', 0.55, 2.00, 150, 60, true, 200, 'BOTELLA'),
    ('REF-008', 'Zumo de Naranja Natural', 'Zumo exprimido 250ml', 'Refrescos', 'UNIDAD', 0.80, 3.50, 50, 20, true, 250, 'BOTELLA');

-- ============================================================
-- ENERGÉTICOS - VENTA DIRECTA
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo, capacidad_ml, tipo_venta)
VALUES
    ('ENER-001', 'Red Bull Original', 'Bebida energética 250ml', 'Energéticos', 'UNIDAD', 1.20, 5.00, 120, 50, true, 250, 'BOTELLA'),
    ('ENER-002', 'Red Bull Sugarfree', 'Bebida energética sin azúcar 250ml', 'Energéticos', 'UNIDAD', 1.20, 5.00, 100, 40, true, 250, 'BOTELLA'),
    ('ENER-003', 'Monster Energy', 'Bebida energética 500ml', 'Energéticos', 'UNIDAD', 1.50, 6.00, 80, 30, true, 500, 'BOTELLA'),
    ('ENER-004', 'Burn Original', 'Bebida energética 250ml', 'Energéticos', 'UNIDAD', 1.00, 4.50, 60, 25, true, 250, 'BOTELLA');

-- ============================================================
-- SNACKS & APERITIVOS - VENTA DIRECTA
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo)
VALUES
    ('SNACK-001', 'Patatas Fritas Lays', 'Patatas clásicas 150g', 'Snacks', 'UNIDAD', 1.20, 4.00, 100, 40, true),
    ('SNACK-002', 'Cacahuetes Salados', 'Cacahuetes tostados 200g', 'Snacks', 'UNIDAD', 1.50, 4.50, 80, 30, true),
    ('SNACK-003', 'Nachos con Salsa', 'Nachos y dips 250g', 'Snacks', 'UNIDAD', 2.00, 6.00, 60, 25, true),
    ('SNACK-004', 'Mix Frutos Secos', 'Mezcla premium 150g', 'Snacks', 'UNIDAD', 2.50, 5.50, 50, 20, true),
    ('SNACK-005', 'Aceitunas Gourmet', 'Aceitunas rellenas 200g', 'Snacks', 'UNIDAD', 2.00, 5.00, 40, 15, true);

-- ============================================================
-- BOTELLAS PREMIUM - VENTA COMPLETA (RESERVADOS VIP)
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo, capacidad_ml, tipo_venta)
VALUES
    ('PREM-001', 'Champagne Moët & Chandon', 'Champagne francés 750ml', 'Premium', 'BOTELLA', 45.00, 150.00, 20, 5, true, 750, 'BOTELLA'),
    ('PREM-002', 'Vodka Grey Goose 1.75L', 'Vodka premium magnum', 'Premium', 'BOTELLA', 60.00, 250.00, 15, 3, true, 1750, 'BOTELLA'),
    ('PREM-003', 'Whisky Chivas Regal 12Y', 'Scotch premium 1L', 'Premium', 'BOTELLA', 35.00, 180.00, 18, 5, true, 1000, 'BOTELLA'),
    ('PREM-004', 'Tequila Patrón Silver', 'Tequila ultra-premium 750ml', 'Premium', 'BOTELLA', 50.00, 200.00, 12, 3, true, 750, 'BOTELLA');

-- ============================================================
-- HIELO & EXTRAS
-- ============================================================

INSERT INTO productos (codigo, nombre, descripcion, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, activo)
VALUES
    ('EXTRA-001', 'Bolsa de Hielo 2kg', 'Hielo en cubos para barras', 'Extras', 'UNIDAD', 1.50, 0.00, 50, 20, true),
    ('EXTRA-002', 'Lima para Copas', 'Limas frescas por unidad', 'Extras', 'UNIDAD', 0.20, 0.00, 100, 40, true),
    ('EXTRA-003', 'Limón para Copas', 'Limones frescos por unidad', 'Extras', 'UNIDAD', 0.15, 0.00, 120, 50, true),
    ('EXTRA-004', 'Menta Fresca', 'Menta para mojitos (manojo)', 'Extras', 'UNIDAD', 0.50, 0.00, 30, 10, true);

-- ============================================================
-- COMENTARIO FINAL
-- ============================================================

COMMENT ON TABLE productos IS 'Inventario actualizado con 60+ productos de ejemplo para POS nightclub';

-- Estadísticas post-migración
DO $$
DECLARE
    total_productos INTEGER;
    total_categorias INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_productos FROM productos WHERE activo = true;
    SELECT COUNT(DISTINCT categoria) INTO total_categorias FROM productos WHERE activo = true;

    RAISE NOTICE '✅ Migración V028 completada exitosamente';
    RAISE NOTICE '📦 Total productos activos: %', total_productos;
    RAISE NOTICE '📂 Total categorías: %', total_categorias;
END $$;
