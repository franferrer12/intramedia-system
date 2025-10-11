-- =====================================================
-- Migración V023: Triggers para Apertura Inteligente de Botellas
-- =====================================================
-- Fecha: 11 Octubre 2025
-- Descripción: Triggers y funciones para descuento automático
--              de stock al abrir botellas en barra
-- =====================================================

-- =====================================================
-- Trigger: Descontar stock al abrir botella
-- =====================================================

CREATE OR REPLACE FUNCTION descontar_stock_al_abrir_botella()
RETURNS TRIGGER AS $$
DECLARE
    producto_record RECORD;
    stock_actual INTEGER;
BEGIN
    -- Obtener información del producto
    SELECT * INTO producto_record
    FROM productos
    WHERE id = NEW.producto_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto ID % no existe', NEW.producto_id;
    END IF;

    -- Verificar que es un producto tipo botella
    IF producto_record.es_botella = FALSE THEN
        RAISE EXCEPTION 'Producto ID % no es una botella. No se puede abrir.', NEW.producto_id;
    END IF;

    -- Obtener stock actual
    SELECT stock INTO stock_actual FROM productos WHERE id = NEW.producto_id;

    -- Verificar que hay suficiente stock
    IF stock_actual < 1 THEN
        RAISE EXCEPTION 'Stock insuficiente para abrir botella de producto ID %. Stock actual: %',
            NEW.producto_id, stock_actual;
    END IF;

    -- Descontar 1 botella del stock cerrado
    UPDATE productos
    SET stock = stock - 1
    WHERE id = NEW.producto_id;

    -- Registrar movimiento de stock
    INSERT INTO movimientos_stock (
        producto_id,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        motivo,
        referencia_id,
        referencia_tipo
    ) VALUES (
        NEW.producto_id,
        'SALIDA',
        1,
        stock_actual,
        stock_actual - 1,
        'Apertura de botella en ' || NEW.ubicacion,
        NEW.id,
        'BOTELLA_ABIERTA'
    );

    RAISE NOTICE 'Producto ID %: Abierta 1 botella en %. Stock nuevo: %',
        NEW.producto_id, NEW.ubicacion, (stock_actual - 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_descontar_stock_al_abrir
    AFTER INSERT ON botellas_abiertas
    FOR EACH ROW
    WHEN (NEW.estado = 'ABIERTA')
    EXECUTE FUNCTION descontar_stock_al_abrir_botella();

-- =====================================================
-- Trigger: Revertir stock si se elimina botella abierta (casos excepcionales)
-- =====================================================

CREATE OR REPLACE FUNCTION revertir_stock_al_eliminar_botella()
RETURNS TRIGGER AS $$
DECLARE
    stock_actual INTEGER;
BEGIN
    -- Solo revertir si la botella estaba abierta y no se vendieron copas
    IF OLD.estado = 'ABIERTA' AND OLD.copas_servidas = 0 THEN

        -- Obtener stock actual
        SELECT stock INTO stock_actual FROM productos WHERE id = OLD.producto_id;

        -- Devolver 1 botella al stock cerrado
        UPDATE productos
        SET stock = stock + 1
        WHERE id = OLD.producto_id;

        -- Registrar movimiento de stock
        INSERT INTO movimientos_stock (
            producto_id,
            tipo_movimiento,
            cantidad,
            stock_anterior,
            stock_nuevo,
            motivo,
            referencia_id,
            referencia_tipo
        ) VALUES (
            OLD.producto_id,
            'ENTRADA',
            1,
            stock_actual,
            stock_actual + 1,
            'Reversión de apertura (botella eliminada sin vender copas)',
            OLD.id,
            'BOTELLA_ABIERTA_ELIMINADA'
        );

        RAISE NOTICE 'Producto ID %: Revertida apertura de botella. Stock nuevo: %',
            OLD.producto_id, (stock_actual + 1);
    ELSE
        RAISE NOTICE 'No se revierte stock para botella ID % (estado: %, copas servidas: %)',
            OLD.id, OLD.estado, OLD.copas_servidas;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_revertir_stock_al_eliminar
    BEFORE DELETE ON botellas_abiertas
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_al_eliminar_botella();

-- =====================================================
-- Función: Abrir botella con validaciones completas
-- =====================================================

CREATE OR REPLACE FUNCTION abrir_botella(
    p_producto_id BIGINT,
    p_ubicacion VARCHAR(100),
    p_empleado_id BIGINT,
    p_sesion_caja_id BIGINT DEFAULT NULL,
    p_notas TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_producto_record RECORD;
    v_botella_id BIGINT;
BEGIN
    -- Validar producto existe y es botella
    SELECT * INTO v_producto_record
    FROM productos
    WHERE id = p_producto_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto ID % no existe', p_producto_id;
    END IF;

    IF v_producto_record.es_botella = FALSE THEN
        RAISE EXCEPTION 'Producto "%" no es una botella', v_producto_record.nombre;
    END IF;

    -- Validar stock disponible
    IF v_producto_record.stock < 1 THEN
        RAISE EXCEPTION 'No hay stock disponible de "%" (stock actual: %)',
            v_producto_record.nombre, v_producto_record.stock;
    END IF;

    -- Validar que copas_por_botella está configurado
    IF v_producto_record.copas_por_botella IS NULL OR v_producto_record.copas_por_botella <= 0 THEN
        RAISE EXCEPTION 'Producto "%" no tiene configurado copas_por_botella', v_producto_record.nombre;
    END IF;

    -- Validar empleado existe
    IF NOT EXISTS (SELECT 1 FROM empleados WHERE id = p_empleado_id) THEN
        RAISE EXCEPTION 'Empleado ID % no existe', p_empleado_id;
    END IF;

    -- Insertar nueva botella abierta (el trigger descontará automáticamente el stock)
    INSERT INTO botellas_abiertas (
        producto_id,
        sesion_caja_id,
        ubicacion,
        copas_totales,
        copas_servidas,
        copas_restantes,
        fecha_apertura,
        estado,
        abierta_por,
        notas
    ) VALUES (
        p_producto_id,
        p_sesion_caja_id,
        p_ubicacion,
        v_producto_record.copas_por_botella,
        0,
        v_producto_record.copas_por_botella,
        NOW(),
        'ABIERTA',
        p_empleado_id,
        p_notas
    )
    RETURNING id INTO v_botella_id;

    RAISE NOTICE 'Botella ID % abierta: % en % con % copas disponibles',
        v_botella_id, v_producto_record.nombre, p_ubicacion, v_producto_record.copas_por_botella;

    RETURN v_botella_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION abrir_botella IS 'Abre una botella con validaciones completas y descuento automático de stock';

-- =====================================================
-- Función: Cerrar botella manualmente
-- =====================================================

CREATE OR REPLACE FUNCTION cerrar_botella(
    p_botella_id BIGINT,
    p_empleado_id BIGINT,
    p_motivo VARCHAR(20) DEFAULT 'CERRADA',
    p_notas TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_botella_record RECORD;
BEGIN
    -- Validar botella existe
    SELECT * INTO v_botella_record
    FROM botellas_abiertas
    WHERE id = p_botella_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Botella ID % no existe', p_botella_id;
    END IF;

    -- Validar que la botella está abierta
    IF v_botella_record.estado != 'ABIERTA' THEN
        RAISE EXCEPTION 'Botella ID % ya está cerrada (estado: %)', p_botella_id, v_botella_record.estado;
    END IF;

    -- Validar motivo de cierre
    IF p_motivo NOT IN ('CERRADA', 'DESPERDICIADA') THEN
        RAISE EXCEPTION 'Motivo de cierre no válido: %. Debe ser CERRADA o DESPERDICIADA', p_motivo;
    END IF;

    -- Validar empleado existe
    IF NOT EXISTS (SELECT 1 FROM empleados WHERE id = p_empleado_id) THEN
        RAISE EXCEPTION 'Empleado ID % no existe', p_empleado_id;
    END IF;

    -- Cerrar la botella
    UPDATE botellas_abiertas
    SET estado = p_motivo,
        fecha_cierre = NOW(),
        cerrada_por = p_empleado_id,
        notas = COALESCE(notas || E'\n', '') || COALESCE(p_notas, 'Cerrada manualmente')
    WHERE id = p_botella_id;

    RAISE NOTICE 'Botella ID % cerrada con motivo: % (Copas servidas: %/%)',
        p_botella_id, p_motivo, v_botella_record.copas_servidas, v_botella_record.copas_totales;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cerrar_botella IS 'Cierra una botella manualmente con validaciones y registro de auditoría';

-- =====================================================
-- Vista: Botellas abiertas con información detallada
-- =====================================================

CREATE OR REPLACE VIEW v_botellas_abiertas_detalle AS
SELECT
    ba.id AS botella_id,
    ba.estado,
    ba.ubicacion,
    ba.copas_totales,
    ba.copas_servidas,
    ba.copas_restantes,
    ROUND((ba.copas_servidas::DECIMAL / NULLIF(ba.copas_totales, 0)) * 100, 1) AS porcentaje_consumido,
    ba.fecha_apertura,
    ba.fecha_cierre,
    EXTRACT(EPOCH FROM (COALESCE(ba.fecha_cierre, NOW()) - ba.fecha_apertura)) / 3600 AS horas_abierta,
    -- Información del producto
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.categoria AS producto_categoria,
    p.precio_copa,
    -- Información del empleado que abrió
    e_abierta.id AS abierta_por_id,
    e_abierta.nombre AS abierta_por_nombre,
    -- Información del empleado que cerró
    e_cerrada.id AS cerrada_por_id,
    e_cerrada.nombre AS cerrada_por_nombre,
    -- Sesión de caja
    sc.id AS sesion_caja_id,
    sc.fecha_apertura AS sesion_apertura,
    -- Cálculos de ingresos
    (ba.copas_servidas * p.precio_copa) AS ingresos_generados,
    (ba.copas_restantes * p.precio_copa) AS ingresos_potenciales_perdidos,
    -- Alertas
    CASE
        WHEN ba.estado = 'ABIERTA' AND ba.copas_restantes = 0 THEN 'VACÍA'
        WHEN ba.estado = 'ABIERTA' AND ba.copas_restantes <= 3 THEN 'CASI_VACÍA'
        WHEN ba.estado = 'ABIERTA' AND EXTRACT(EPOCH FROM (NOW() - ba.fecha_apertura)) > 86400 THEN 'ABIERTA_MAS_24H'
        ELSE NULL
    END AS alerta,
    ba.notas
FROM botellas_abiertas ba
JOIN productos p ON ba.producto_id = p.id
LEFT JOIN empleados e_abierta ON ba.abierta_por = e_abierta.id
LEFT JOIN empleados e_cerrada ON ba.cerrada_por = e_cerrada.id
LEFT JOIN sesiones_caja sc ON ba.sesion_caja_id = sc.id;

COMMENT ON VIEW v_botellas_abiertas_detalle IS 'Vista detallada de botellas abiertas con cálculos de ingresos y alertas';

-- =====================================================
-- Vista: Stock total (cerrado + abierto)
-- =====================================================

CREATE OR REPLACE VIEW v_stock_total_botellas AS
SELECT
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.categoria,
    p.stock AS stock_cerrado_botellas,
    COUNT(ba.id) FILTER (WHERE ba.estado = 'ABIERTA') AS stock_abierto_botellas,
    SUM(ba.copas_restantes) FILTER (WHERE ba.estado = 'ABIERTA') AS copas_disponibles,
    ROUND(
        SUM(ba.copas_restantes) FILTER (WHERE ba.estado = 'ABIERTA')::DECIMAL / NULLIF(p.copas_por_botella, 0),
        2
    ) AS stock_abierto_equivalente_botellas,
    p.stock + COALESCE(
        ROUND(
            SUM(ba.copas_restantes) FILTER (WHERE ba.estado = 'ABIERTA')::DECIMAL / NULLIF(p.copas_por_botella, 0),
            2
        ),
        0
    ) AS stock_total_equivalente,
    p.stock_minimo,
    p.stock_maximo,
    CASE
        WHEN p.stock + COALESCE(
            ROUND(
                SUM(ba.copas_restantes) FILTER (WHERE ba.estado = 'ABIERTA')::DECIMAL / NULLIF(p.copas_por_botella, 0),
                2
            ),
            0
        ) <= p.stock_minimo THEN 'BAJO'
        WHEN p.stock + COALESCE(
            ROUND(
                SUM(ba.copas_restantes) FILTER (WHERE ba.estado = 'ABIERTA')::DECIMAL / NULLIF(p.copas_por_botella, 0),
                2
            ),
            0
        ) >= p.stock_maximo THEN 'ALTO'
        ELSE 'NORMAL'
    END AS nivel_stock
FROM productos p
LEFT JOIN botellas_abiertas ba ON ba.producto_id = p.id
WHERE p.es_botella = TRUE
GROUP BY p.id, p.nombre, p.categoria, p.stock, p.copas_por_botella, p.stock_minimo, p.stock_maximo;

COMMENT ON VIEW v_stock_total_botellas IS 'Vista consolidada del stock total (cerrado + abierto) con alertas';

-- =====================================================
-- Verificación de la migración
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migración V023 completada: Triggers de apertura de botellas creados';
    RAISE NOTICE '- 2 triggers: descuento automático al abrir y reversión al eliminar';
    RAISE NOTICE '- 2 funciones: abrir_botella() y cerrar_botella()';
    RAISE NOTICE '- 2 vistas: detalle de botellas abiertas y stock total consolidado';
END $$;
