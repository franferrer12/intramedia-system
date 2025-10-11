-- =====================================================
-- Migración V024: Datos de Ejemplo - Sistema Botellas VIP
-- =====================================================
-- Fecha: 11 Octubre 2025
-- Descripción: Inserta datos de ejemplo para demostración
--              del sistema de botellas VIP
-- =====================================================

-- NOTA: Esta migración es opcional y solo para desarrollo/demo
-- En producción, comentar o eliminar según necesidades

-- =====================================================
-- 1. Insertar productos de ejemplo (solo si no existen)
-- =====================================================

-- Verificar si ya hay productos tipo botella
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM productos WHERE es_botella = TRUE LIMIT 1) THEN

        -- Vodka Premium
        INSERT INTO productos (nombre, descripcion, categoria, precio_venta, stock, stock_minimo, stock_maximo,
                              unidad_medida, capacidad_ml, copas_por_botella, precio_copa, precio_botella_vip, es_botella)
        VALUES
        ('Vodka Absolut', 'Vodka premium sueco 40% vol', 'BEBIDAS', 85.00, 15, 5, 30,
         'BOTELLA', 750, 25, 8.00, 180.00, TRUE),

        ('Vodka Grey Goose', 'Vodka francés ultra premium 40% vol', 'BEBIDAS', 120.00, 8, 3, 20,
         'BOTELLA', 750, 25, 12.00, 250.00, TRUE);

        -- Gin Premium
        INSERT INTO productos (nombre, descripcion, categoria, precio_venta, stock, stock_minimo, stock_maximo,
                              unidad_medida, capacidad_ml, copas_por_botella, precio_copa, precio_botella_vip, es_botella)
        VALUES
        ('Gin Tanqueray', 'London Dry Gin 47.3% vol', 'BEBIDAS', 75.00, 12, 4, 25,
         'BOTELLA', 700, 23, 9.00, 180.00, TRUE),

        ('Gin Hendricks', 'Scottish Gin con pepino y rosa 41.4% vol', 'BEBIDAS', 95.00, 6, 3, 15,
         'BOTELLA', 700, 23, 11.00, 220.00, TRUE);

        -- Ron Premium
        INSERT INTO productos (nombre, descripcion, categoria, precio_venta, stock, stock_minimo, stock_maximo,
                              unidad_medida, capacidad_ml, copas_por_botella, precio_copa, precio_botella_vip, es_botella)
        VALUES
        ('Ron Havana Club 7', 'Ron cubano añejo 40% vol', 'BEBIDAS', 65.00, 18, 5, 30,
         'BOTELLA', 750, 25, 7.50, 160.00, TRUE),

        ('Ron Zacapa 23', 'Ron guatemalteco premium 40% vol', 'BEBIDAS', 110.00, 5, 2, 12,
         'BOTELLA', 750, 25, 11.00, 240.00, TRUE);

        -- Whisky Premium
        INSERT INTO productos (nombre, descripcion, categoria, precio_venta, stock, stock_minimo, stock_maximo,
                              unidad_medida, capacidad_ml, copas_por_botella, precio_copa, precio_botella_vip, es_botella)
        VALUES
        ('Whisky Johnnie Walker Black', 'Blended Scotch Whisky 40% vol', 'BEBIDAS', 80.00, 10, 4, 20,
         'BOTELLA', 700, 23, 10.00, 200.00, TRUE),

        ('Whisky Chivas Regal 12', 'Blended Scotch Whisky 40% vol', 'BEBIDAS', 90.00, 8, 3, 18,
         'BOTELLA', 700, 23, 10.50, 210.00, TRUE);

        -- Tequila Premium
        INSERT INTO productos (nombre, descripcion, categoria, precio_venta, stock, stock_minimo, stock_maximo,
                              unidad_medida, capacidad_ml, copas_por_botella, precio_copa, precio_botella_vip, es_botella)
        VALUES
        ('Tequila Patrón Silver', 'Tequila 100% agave blanco 40% vol', 'BEBIDAS', 100.00, 7, 3, 15,
         'BOTELLA', 750, 25, 10.00, 220.00, TRUE),

        ('Tequila Don Julio Reposado', 'Tequila 100% agave reposado 38% vol', 'BEBIDAS', 115.00, 5, 2, 12,
         'BOTELLA', 750, 25, 11.50, 250.00, TRUE);

        -- Champagne/Espumosos
        INSERT INTO productos (nombre, descripcion, categoria, precio_venta, stock, stock_minimo, stock_maximo,
                              unidad_medida, capacidad_ml, copas_por_botella, precio_copa, precio_botella_vip, es_botella)
        VALUES
        ('Moët & Chandon Brut', 'Champagne francés 12% vol', 'BEBIDAS', 85.00, 10, 3, 20,
         'BOTELLA', 750, 6, 15.00, 80.00, TRUE),

        ('Veuve Clicquot Brut', 'Champagne francés premium 12% vol', 'BEBIDAS', 110.00, 6, 2, 15,
         'BOTELLA', 750, 6, 20.00, 110.00, TRUE);

        RAISE NOTICE 'Insertados 12 productos tipo botella de ejemplo';
    ELSE
        RAISE NOTICE 'Ya existen productos tipo botella. Omitiendo inserción de productos de ejemplo.';
    END IF;
END $$;

-- =====================================================
-- 2. Abrir botellas de ejemplo en diferentes ubicaciones
-- =====================================================

-- NOTA: Esto requiere que exista al menos 1 empleado en la BD
DO $$
DECLARE
    v_empleado_id BIGINT;
    v_producto_vodka_id BIGINT;
    v_producto_gin_id BIGINT;
    v_producto_ron_id BIGINT;
    v_producto_whisky_id BIGINT;
    v_botella_id BIGINT;
BEGIN
    -- Obtener un empleado existente (idealmente un bartender o admin)
    SELECT id INTO v_empleado_id FROM empleados LIMIT 1;

    IF v_empleado_id IS NULL THEN
        RAISE NOTICE 'No hay empleados en la base de datos. Omitiendo apertura de botellas de ejemplo.';
        RETURN;
    END IF;

    -- Obtener IDs de productos
    SELECT id INTO v_producto_vodka_id FROM productos WHERE LOWER(nombre) LIKE '%absolut%' LIMIT 1;
    SELECT id INTO v_producto_gin_id FROM productos WHERE LOWER(nombre) LIKE '%tanqueray%' LIMIT 1;
    SELECT id INTO v_producto_ron_id FROM productos WHERE LOWER(nombre) LIKE '%havana%' LIMIT 1;
    SELECT id INTO v_producto_whisky_id FROM productos WHERE LOWER(nombre) LIKE '%johnnie%' LIMIT 1;

    -- Abrir botella de Vodka en barra principal (medio servida)
    IF v_producto_vodka_id IS NOT NULL THEN
        -- Usar la función abrir_botella para aprovechar las validaciones
        SELECT abrir_botella(
            v_producto_vodka_id,
            'BARRA_PRINCIPAL',
            v_empleado_id,
            NULL,
            'Botella de ejemplo - Demo sistema'
        ) INTO v_botella_id;

        -- Simular que ya se vendieron 12 copas
        UPDATE botellas_abiertas
        SET copas_servidas = 12,
            copas_restantes = 13
        WHERE id = v_botella_id;

        RAISE NOTICE 'Abierta botella de Vodka Absolut en BARRA_PRINCIPAL (12/25 copas servidas)';
    END IF;

    -- Abrir botella de Gin en barra VIP (casi llena)
    IF v_producto_gin_id IS NOT NULL THEN
        SELECT abrir_botella(
            v_producto_gin_id,
            'BARRA_VIP',
            v_empleado_id,
            NULL,
            'Botella de ejemplo para zona VIP'
        ) INTO v_botella_id;

        -- Simular que se vendieron 3 copas
        UPDATE botellas_abiertas
        SET copas_servidas = 3,
            copas_restantes = 20
        WHERE id = v_botella_id;

        RAISE NOTICE 'Abierta botella de Gin Tanqueray en BARRA_VIP (3/23 copas servidas)';
    END IF;

    -- Abrir botella de Ron en coctelería (casi vacía)
    IF v_producto_ron_id IS NOT NULL THEN
        SELECT abrir_botella(
            v_producto_ron_id,
            'COCTELERIA',
            v_empleado_id,
            NULL,
            'Botella para preparación de cócteles'
        ) INTO v_botella_id;

        -- Simular que está casi vacía
        UPDATE botellas_abiertas
        SET copas_servidas = 23,
            copas_restantes = 2
        WHERE id = v_botella_id;

        RAISE NOTICE 'Abierta botella de Ron Havana Club en COCTELERIA (23/25 copas servidas - ALERTA: casi vacía)';
    END IF;

    -- Abrir botella de Whisky en barra principal (nueva, sin servir)
    IF v_producto_whisky_id IS NOT NULL THEN
        SELECT abrir_botella(
            v_producto_whisky_id,
            'BARRA_PRINCIPAL',
            v_empleado_id,
            NULL,
            'Botella recién abierta'
        ) INTO v_botella_id;

        RAISE NOTICE 'Abierta botella de Whisky Johnnie Walker en BARRA_PRINCIPAL (0/23 copas servidas - nueva)';
    END IF;

END $$;

-- =====================================================
-- 3. Crear algunas ventas de ejemplo
-- =====================================================

-- NOTA: Esto requiere que exista al menos 1 venta en la BD para obtener estructura
DO $$
DECLARE
    v_venta_id BIGINT;
    v_producto_gin_id BIGINT;
    v_producto_champagne_id BIGINT;
    v_botella_gin_id BIGINT;
    v_empleado_id BIGINT;
BEGIN
    -- Verificar si hay ventas existentes
    IF NOT EXISTS (SELECT 1 FROM ventas LIMIT 1) THEN
        RAISE NOTICE 'No hay ventas en la base de datos. Omitiendo creación de ventas de ejemplo.';
        RETURN;
    END IF;

    -- Obtener IDs necesarios
    SELECT id INTO v_empleado_id FROM empleados LIMIT 1;
    SELECT id INTO v_producto_gin_id FROM productos WHERE LOWER(nombre) LIKE '%tanqueray%' LIMIT 1;
    SELECT id INTO v_producto_champagne_id FROM productos WHERE LOWER(nombre) LIKE '%moet%' LIMIT 1;
    SELECT id INTO v_botella_gin_id FROM botellas_abiertas WHERE producto_id = v_producto_gin_id AND estado = 'ABIERTA' LIMIT 1;

    IF v_empleado_id IS NULL OR v_producto_gin_id IS NULL THEN
        RAISE NOTICE 'Faltan datos necesarios. Omitiendo creación de ventas de ejemplo.';
        RETURN;
    END IF;

    -- Venta 1: Botella completa de Champagne (Pack VIP)
    IF v_producto_champagne_id IS NOT NULL THEN
        INSERT INTO ventas (fecha, total, metodo_pago, estado, empleado_id)
        VALUES (NOW(), 80.00, 'TARJETA', 'COMPLETADA', v_empleado_id)
        RETURNING id INTO v_venta_id;

        INSERT INTO detalle_venta (
            venta_id, producto_id, cantidad, precio_unitario,
            tipo_venta, es_copa_individual, descuento_pack_vip, notas_venta
        ) VALUES (
            v_venta_id, v_producto_champagne_id, 1, 80.00,
            'PACK_VIP', FALSE, 10.00, 'Mesa VIP 5 - Celebración cumpleaños'
        );

        RAISE NOTICE 'Creada venta de ejemplo 1: Pack VIP Champagne';
    END IF;

    -- Venta 2: 2 copas de Gin de botella abierta
    IF v_botella_gin_id IS NOT NULL THEN
        INSERT INTO ventas (fecha, total, metodo_pago, estado, empleado_id)
        VALUES (NOW(), 18.00, 'EFECTIVO', 'COMPLETADA', v_empleado_id)
        RETURNING id INTO v_venta_id;

        INSERT INTO detalle_venta (
            venta_id, producto_id, cantidad, precio_unitario,
            tipo_venta, es_copa_individual, botella_abierta_id, copas_vendidas, notas_venta
        ) VALUES (
            v_venta_id, v_producto_gin_id, 2, 9.00,
            'COPA_INDIVIDUAL', TRUE, v_botella_gin_id, 2, 'Barra VIP - 2 Gin Tonic'
        );

        RAISE NOTICE 'Creada venta de ejemplo 2: 2 copas de Gin de botella abierta';
    END IF;

END $$;

-- =====================================================
-- 4. Mostrar resumen del sistema
-- =====================================================

DO $$
DECLARE
    total_productos INTEGER;
    total_botellas_abiertas INTEGER;
    total_copas_disponibles INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_productos FROM productos WHERE es_botella = TRUE;
    SELECT COUNT(*) INTO total_botellas_abiertas FROM botellas_abiertas WHERE estado = 'ABIERTA';
    SELECT SUM(copas_restantes) INTO total_copas_disponibles FROM botellas_abiertas WHERE estado = 'ABIERTA';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN SISTEMA BOTELLAS VIP';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Productos tipo botella: %', COALESCE(total_productos, 0);
    RAISE NOTICE 'Botellas abiertas activas: %', COALESCE(total_botellas_abiertas, 0);
    RAISE NOTICE 'Copas disponibles totales: %', COALESCE(total_copas_disponibles, 0);
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migración V024 completada: Datos de ejemplo insertados';
    RAISE NOTICE 'NOTA: Esta migración es opcional para desarrollo/demo';
END $$;

-- =====================================================
-- Queries útiles para verificar los datos
-- =====================================================

-- Descomentar para ver los datos insertados:

-- Ver todos los productos tipo botella
-- SELECT id, nombre, categoria, precio_copa, precio_botella_vip, stock, copas_por_botella FROM productos WHERE es_botella = TRUE;

-- Ver botellas abiertas con detalle
-- SELECT * FROM v_botellas_abiertas_detalle ORDER BY copas_restantes ASC;

-- Ver stock total (cerrado + abierto)
-- SELECT * FROM v_stock_total_botellas ORDER BY stock_total_equivalente ASC;

-- Ver resumen de ventas por tipo
-- SELECT * FROM v_ventas_botellas_resumen;

-- Ver análisis de rentabilidad
-- SELECT * FROM v_rentabilidad_botellas ORDER BY diferencia_copas_vs_pack DESC;
