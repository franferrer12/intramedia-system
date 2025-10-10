-- ============================================
-- MIGRACIÓN V019: Sistema POS (Point of Sale)
-- ============================================
-- Fecha: 2025-10-10
-- Descripción: Tablas para sistema de punto de venta

-- ============================================
-- Tabla: sesiones_caja
-- Descripción: Control de apertura/cierre de cajas registradoras
-- ============================================
CREATE TABLE IF NOT EXISTS sesiones_caja (
    id BIGSERIAL PRIMARY KEY,
    nombre_caja VARCHAR(100) NOT NULL,  -- Ej: "Barra Principal", "Barra VIP"
    empleado_apertura_id BIGINT NOT NULL REFERENCES empleados(id),
    empleado_cierre_id BIGINT REFERENCES empleados(id),
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- Fondo de caja inicial
    monto_esperado DECIMAL(10,2),  -- Calculado: inicial + ventas
    monto_real DECIMAL(10,2),  -- Contado al cierre
    diferencia DECIMAL(10,2),  -- Real - Esperado
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA')),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para sesiones_caja
CREATE INDEX idx_sesiones_caja_fecha_apertura ON sesiones_caja(fecha_apertura DESC);
CREATE INDEX idx_sesiones_caja_estado ON sesiones_caja(estado);
CREATE INDEX idx_sesiones_caja_empleado_apertura ON sesiones_caja(empleado_apertura_id);

-- ============================================
-- Tabla: ventas
-- Descripción: Registros de ventas realizadas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
    id BIGSERIAL PRIMARY KEY,
    sesion_caja_id BIGINT NOT NULL REFERENCES sesiones_caja(id) ON DELETE CASCADE,
    numero_ticket VARCHAR(50) NOT NULL UNIQUE,  -- AUTO: VTA-20251010-0001
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'MIXTO')),
    monto_efectivo DECIMAL(10,2),
    monto_tarjeta DECIMAL(10,2),
    empleado_id BIGINT NOT NULL REFERENCES empleados(id),  -- Cajero que realizó la venta
    evento_id BIGINT REFERENCES eventos(id),  -- Opcional: vincular a evento específico
    cliente_nombre VARCHAR(200),  -- Opcional: nombre del cliente
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para ventas
CREATE INDEX idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX idx_ventas_sesion_caja ON ventas(sesion_caja_id);
CREATE INDEX idx_ventas_empleado ON ventas(empleado_id);
CREATE INDEX idx_ventas_evento ON ventas(evento_id);
CREATE INDEX idx_ventas_metodo_pago ON ventas(metodo_pago);

-- ============================================
-- Tabla: detalle_venta
-- Descripción: Líneas de productos en cada venta
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_venta (
    id BIGSERIAL PRIMARY KEY,
    venta_id BIGINT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,  -- Precio en el momento de la venta
    subtotal DECIMAL(10,2) NOT NULL,  -- cantidad * precio_unitario
    descuento DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,  -- subtotal - descuento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para detalle_venta
CREATE INDEX idx_detalle_venta_venta ON detalle_venta(venta_id);
CREATE INDEX idx_detalle_venta_producto ON detalle_venta(producto_id);

-- ============================================
-- Tabla: estadisticas_pos_cache
-- Descripción: Caché de estadísticas para dashboard en tiempo real
-- ============================================
CREATE TABLE IF NOT EXISTS estadisticas_pos_cache (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    sesion_caja_id BIGINT REFERENCES sesiones_caja(id),
    total_ventas INTEGER DEFAULT 0,
    total_ingresos DECIMAL(10,2) DEFAULT 0.00,
    productos_vendidos INTEGER DEFAULT 0,
    ticket_promedio DECIMAL(10,2) DEFAULT 0.00,
    hora_pico VARCHAR(5),  -- Ej: "02:00"
    producto_mas_vendido_id BIGINT REFERENCES productos(id),
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fecha, sesion_caja_id)
);

-- Índices para estadisticas_pos_cache
CREATE INDEX idx_estadisticas_pos_fecha ON estadisticas_pos_cache(fecha DESC);

-- ============================================
-- Trigger: Actualizar updated_at en sesiones_caja
-- ============================================
CREATE OR REPLACE FUNCTION update_sesiones_caja_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sesiones_caja_timestamp
BEFORE UPDATE ON sesiones_caja
FOR EACH ROW
EXECUTE FUNCTION update_sesiones_caja_timestamp();

-- ============================================
-- Trigger: Auto-generar número de ticket
-- ============================================
CREATE OR REPLACE FUNCTION generar_numero_ticket()
RETURNS TRIGGER AS $$
DECLARE
    fecha_str TEXT;
    contador INTEGER;
    nuevo_numero TEXT;
BEGIN
    IF NEW.numero_ticket IS NULL OR NEW.numero_ticket = '' THEN
        -- Formato: VTA-YYYYMMDD-NNNN
        fecha_str := TO_CHAR(NEW.fecha, 'YYYYMMDD');

        -- Obtener el último número del día
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(numero_ticket FROM 'VTA-[0-9]{8}-([0-9]+)') AS INTEGER)
        ), 0) + 1
        INTO contador
        FROM ventas
        WHERE numero_ticket LIKE 'VTA-' || fecha_str || '-%';

        -- Generar nuevo número con padding de 4 dígitos
        nuevo_numero := 'VTA-' || fecha_str || '-' || LPAD(contador::TEXT, 4, '0');
        NEW.numero_ticket := nuevo_numero;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_numero_ticket
BEFORE INSERT ON ventas
FOR EACH ROW
EXECUTE FUNCTION generar_numero_ticket();

-- ============================================
-- Trigger: Actualizar stock automáticamente al crear venta
-- ============================================
CREATE OR REPLACE FUNCTION descontar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    producto_rec RECORD;
    stock_actual INTEGER;
BEGIN
    -- Obtener datos del producto
    SELECT p.*, i.cantidad_actual
    INTO producto_rec
    FROM productos p
    LEFT JOIN inventario i ON i.producto_id = p.id
    WHERE p.id = NEW.producto_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % no encontrado', NEW.producto_id;
    END IF;

    -- Verificar stock disponible (solo si se controla inventario)
    IF producto_rec.cantidad_actual IS NOT NULL THEN
        stock_actual := producto_rec.cantidad_actual;

        IF stock_actual < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para producto "%". Disponible: %, Solicitado: %',
                producto_rec.nombre, stock_actual, NEW.cantidad;
        END IF;

        -- Descontar del inventario
        UPDATE inventario
        SET cantidad_actual = cantidad_actual - NEW.cantidad,
            updated_at = CURRENT_TIMESTAMP
        WHERE producto_id = NEW.producto_id;

        -- Registrar movimiento de stock
        INSERT INTO movimientos_stock (producto_id, tipo, cantidad, motivo, referencia)
        VALUES (
            NEW.producto_id,
            'SALIDA',
            NEW.cantidad,
            'Venta POS',
            'Venta #' || (SELECT numero_ticket FROM ventas WHERE id = NEW.venta_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_descontar_stock_venta
AFTER INSERT ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION descontar_stock_venta();

-- ============================================
-- Trigger: Crear transacción financiera automática al crear venta
-- ============================================
CREATE OR REPLACE FUNCTION crear_transaccion_desde_venta()
RETURNS TRIGGER AS $$
DECLARE
    categoria_ventas_id BIGINT;
    venta_rec RECORD;
BEGIN
    -- Obtener datos de la venta
    SELECT v.*, s.nombre_caja
    INTO venta_rec
    FROM ventas v
    JOIN sesiones_caja s ON s.id = v.sesion_caja_id
    WHERE v.id = NEW.id;

    -- Buscar o crear categoría "Ventas POS"
    SELECT id INTO categoria_ventas_id
    FROM categorias_transaccion
    WHERE nombre = 'Ventas POS' AND tipo = 'INGRESO'
    LIMIT 1;

    IF categoria_ventas_id IS NULL THEN
        INSERT INTO categorias_transaccion (nombre, tipo, descripcion)
        VALUES ('Ventas POS', 'INGRESO', 'Ingresos por ventas del sistema POS')
        RETURNING id INTO categoria_ventas_id;
    END IF;

    -- Crear transacción de ingreso
    INSERT INTO transacciones (
        tipo,
        concepto,
        monto,
        fecha,
        categoria_id,
        metodo_pago,
        descripcion,
        evento_id
    ) VALUES (
        'INGRESO',
        'Venta ' || NEW.numero_ticket || ' - ' || venta_rec.nombre_caja,
        NEW.total,
        NEW.fecha,
        categoria_ventas_id,
        NEW.metodo_pago,
        CASE
            WHEN NEW.observaciones IS NOT NULL
            THEN 'Venta POS: ' || NEW.observaciones
            ELSE 'Venta POS'
        END,
        NEW.evento_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crear_transaccion_desde_venta
AFTER INSERT ON ventas
FOR EACH ROW
EXECUTE FUNCTION crear_transaccion_desde_venta();

-- ============================================
-- Función: Cerrar sesión de caja
-- ============================================
CREATE OR REPLACE FUNCTION cerrar_sesion_caja(
    p_sesion_id BIGINT,
    p_empleado_cierre_id BIGINT,
    p_monto_real DECIMAL(10,2),
    p_observaciones TEXT DEFAULT NULL
)
RETURNS TABLE (
    sesion_id BIGINT,
    monto_esperado DECIMAL(10,2),
    monto_real DECIMAL(10,2),
    diferencia DECIMAL(10,2),
    total_ventas INTEGER
) AS $$
DECLARE
    v_monto_esperado DECIMAL(10,2);
    v_total_ventas INTEGER;
    v_monto_inicial DECIMAL(10,2);
BEGIN
    -- Obtener datos de la sesión
    SELECT s.monto_inicial,
           COUNT(v.id),
           COALESCE(SUM(v.total), 0)
    INTO v_monto_inicial, v_total_ventas, v_monto_esperado
    FROM sesiones_caja s
    LEFT JOIN ventas v ON v.sesion_caja_id = s.id
    WHERE s.id = p_sesion_id
    GROUP BY s.monto_inicial;

    v_monto_esperado := v_monto_inicial + COALESCE(v_monto_esperado, 0);

    -- Actualizar sesión
    UPDATE sesiones_caja
    SET estado = 'CERRADA',
        fecha_cierre = CURRENT_TIMESTAMP,
        empleado_cierre_id = p_empleado_cierre_id,
        monto_esperado = v_monto_esperado,
        monto_real = p_monto_real,
        diferencia = p_monto_real - v_monto_esperado,
        observaciones = COALESCE(p_observaciones, observaciones)
    WHERE id = p_sesion_id;

    -- Retornar resultados
    RETURN QUERY
    SELECT
        p_sesion_id,
        v_monto_esperado,
        p_monto_real,
        p_monto_real - v_monto_esperado,
        v_total_ventas;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comentarios de tablas
-- ============================================
COMMENT ON TABLE sesiones_caja IS 'Control de apertura y cierre de cajas registradoras';
COMMENT ON TABLE ventas IS 'Registro de todas las ventas realizadas en el POS';
COMMENT ON TABLE detalle_venta IS 'Detalle de productos vendidos en cada venta';
COMMENT ON TABLE estadisticas_pos_cache IS 'Caché de estadísticas para optimizar dashboard en tiempo real';

COMMENT ON COLUMN sesiones_caja.nombre_caja IS 'Nombre de la caja/barra (ej: Barra Principal, Barra VIP)';
COMMENT ON COLUMN sesiones_caja.monto_inicial IS 'Fondo de caja al abrir (efectivo inicial)';
COMMENT ON COLUMN sesiones_caja.monto_esperado IS 'Calculado: monto_inicial + suma de ventas';
COMMENT ON COLUMN sesiones_caja.monto_real IS 'Efectivo contado al cerrar la caja';
COMMENT ON COLUMN sesiones_caja.diferencia IS 'Diferencia entre monto_real y monto_esperado (puede ser positiva o negativa)';

COMMENT ON COLUMN ventas.numero_ticket IS 'Número único de ticket generado automáticamente (VTA-YYYYMMDD-NNNN)';
COMMENT ON COLUMN ventas.metodo_pago IS 'EFECTIVO, TARJETA o MIXTO';
COMMENT ON COLUMN ventas.monto_efectivo IS 'Monto pagado en efectivo (si es EFECTIVO o MIXTO)';
COMMENT ON COLUMN ventas.monto_tarjeta IS 'Monto pagado con tarjeta (si es TARJETA o MIXTO)';

COMMENT ON COLUMN detalle_venta.precio_unitario IS 'Precio del producto en el momento de la venta (puede diferir del precio actual)';
COMMENT ON COLUMN detalle_venta.subtotal IS 'cantidad × precio_unitario';
COMMENT ON COLUMN detalle_venta.total IS 'subtotal - descuento';
