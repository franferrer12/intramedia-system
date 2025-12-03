-- ============================================================================
-- Migración V015: Activos Fijos e Inversión Inicial
-- Descripción: Tablas para gestión de activos fijos, amortizaciones y ROI
-- Fecha: 2025-10-10
-- ============================================================================

-- Tabla de Activos Fijos
CREATE TABLE activos_fijos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,

    -- Valores financieros
    valor_inicial DECIMAL(12,2) NOT NULL CHECK (valor_inicial >= 0),
    fecha_adquisicion DATE NOT NULL,
    vida_util_anios INTEGER NOT NULL CHECK (vida_util_anios > 0),
    valor_residual DECIMAL(12,2) DEFAULT 0.00 CHECK (valor_residual >= 0),

    -- Valores calculados (se actualizan automáticamente)
    amortizacion_anual DECIMAL(12,2) DEFAULT 0.00,
    amortizacion_mensual DECIMAL(12,2) DEFAULT 0.00,
    amortizacion_acumulada DECIMAL(12,2) DEFAULT 0.00,
    valor_neto DECIMAL(12,2) DEFAULT 0.00,

    -- Información adicional
    proveedor_id BIGINT REFERENCES proveedores(id),
    numero_factura VARCHAR(100),
    ubicacion VARCHAR(200),

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,

    -- Auditoría
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_categoria CHECK (categoria IN (
        'INFRAESTRUCTURA',    -- Obra, reformas, instalaciones
        'EQUIPAMIENTO',        -- Equipo de sonido, iluminación, barras
        'TECNOLOGIA',          -- Software, hardware, sistemas
        'MOBILIARIO',          -- Mesas, sillas, decoración
        'LICENCIAS',           -- Licencias de negocio, permisos
        'STOCK_INICIAL',       -- Inventario inicial de productos
        'VEHICULOS',           -- Vehículos de transporte
        'OTROS'                -- Otros activos
    ))
);

-- Índices para activos fijos
CREATE INDEX idx_activos_categoria ON activos_fijos(categoria);
CREATE INDEX idx_activos_activo ON activos_fijos(activo);
CREATE INDEX idx_activos_proveedor ON activos_fijos(proveedor_id);
CREATE INDEX idx_activos_fecha_adquisicion ON activos_fijos(fecha_adquisicion);

-- Tabla de Inversión Inicial
CREATE TABLE inversion_inicial (
    id BIGSERIAL PRIMARY KEY,
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,

    -- Valor
    monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
    fecha DATE NOT NULL,

    -- Relación con activo fijo (opcional)
    activo_fijo_id BIGINT REFERENCES activos_fijos(id),

    -- Información adicional
    proveedor_id BIGINT REFERENCES proveedores(id),
    numero_factura VARCHAR(100),
    forma_pago VARCHAR(50),

    -- Auditoría
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_inversion_categoria CHECK (categoria IN (
        'INFRAESTRUCTURA',
        'EQUIPAMIENTO',
        'TECNOLOGIA',
        'MOBILIARIO',
        'LICENCIAS',
        'STOCK_INICIAL',
        'VEHICULOS',
        'MARKETING',
        'FORMACION',
        'OTROS'
    ))
);

-- Índices para inversión inicial
CREATE INDEX idx_inversion_categoria ON inversion_inicial(categoria);
CREATE INDEX idx_inversion_fecha ON inversion_inicial(fecha);
CREATE INDEX idx_inversion_activo ON inversion_inicial(activo_fijo_id);

-- Tabla de Historial de Amortizaciones
CREATE TABLE amortizaciones (
    id BIGSERIAL PRIMARY KEY,
    activo_fijo_id BIGINT NOT NULL REFERENCES activos_fijos(id) ON DELETE CASCADE,

    -- Periodo
    periodo VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    fecha_calculo DATE NOT NULL,

    -- Valores
    amortizacion_mensual DECIMAL(12,2) NOT NULL,
    amortizacion_acumulada DECIMAL(12,2) NOT NULL,
    valor_neto DECIMAL(12,2) NOT NULL,

    -- Auditoría
    calculado_en TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraint único por periodo y activo
    UNIQUE(activo_fijo_id, periodo)
);

-- Índices para amortizaciones
CREATE INDEX idx_amortizaciones_activo ON amortizaciones(activo_fijo_id);
CREATE INDEX idx_amortizaciones_periodo ON amortizaciones(periodo);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para calcular amortización al crear o actualizar activo
CREATE OR REPLACE FUNCTION calcular_amortizacion_activo()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular amortización anual: (valor_inicial - valor_residual) / vida_util_anios
    NEW.amortizacion_anual := (NEW.valor_inicial - NEW.valor_residual) / NEW.vida_util_anios;

    -- Calcular amortización mensual: amortización_anual / 12
    NEW.amortizacion_mensual := NEW.amortizacion_anual / 12;

    -- Calcular meses desde adquisición
    DECLARE
        meses_transcurridos INTEGER;
    BEGIN
        meses_transcurridos := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.fecha_adquisicion)) * 12
                             + EXTRACT(MONTH FROM AGE(CURRENT_DATE, NEW.fecha_adquisicion));

        -- Calcular amortización acumulada: amortizacion_mensual * meses_transcurridos
        NEW.amortizacion_acumulada := LEAST(
            NEW.amortizacion_mensual * meses_transcurridos,
            NEW.valor_inicial - NEW.valor_residual
        );

        -- Calcular valor neto: valor_inicial - amortizacion_acumulada
        NEW.valor_neto := NEW.valor_inicial - NEW.amortizacion_acumulada;
    END;

    -- Actualizar fecha de modificación
    NEW.actualizado_en := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular amortización automáticamente
CREATE TRIGGER trigger_calcular_amortizacion_activo
BEFORE INSERT OR UPDATE ON activos_fijos
FOR EACH ROW
EXECUTE FUNCTION calcular_amortizacion_activo();

-- Función para actualizar timestamp de actualización
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp en inversion_inicial
CREATE TRIGGER trigger_actualizar_timestamp_inversion
BEFORE UPDATE ON inversion_inicial
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp();

-- ============================================================================
-- DATOS INICIALES (Ejemplos)
-- ============================================================================

-- Ejemplo de activo fijo: Sistema de sonido
INSERT INTO activos_fijos (
    nombre, descripcion, categoria,
    valor_inicial, fecha_adquisicion, vida_util_anios, valor_residual,
    ubicacion, notas
) VALUES (
    'Sistema de Sonido Pioneer',
    'Sistema de sonido profesional completo con altavoces, mezcladora y amplificadores',
    'EQUIPAMIENTO',
    25000.00,
    '2024-01-15',
    10,
    2500.00,
    'Sala principal',
    'Instalado por TechSound SL - Garantía 3 años'
);

-- Ejemplo de activo fijo: Reforma local
INSERT INTO activos_fijos (
    nombre, descripcion, categoria,
    valor_inicial, fecha_adquisicion, vida_util_anios, valor_residual,
    ubicacion, notas
) VALUES (
    'Reforma integral del local',
    'Reforma completa: baños, barras, pista de baile, iluminación, aire acondicionado',
    'INFRAESTRUCTURA',
    80000.00,
    '2024-01-01',
    20,
    5000.00,
    'Todo el local',
    'Constructora García e Hijos - Licencia obra mayor'
);

-- Ejemplo de activo fijo: Licencias
INSERT INTO activos_fijos (
    nombre, descripcion, categoria,
    valor_inicial, fecha_adquisicion, vida_util_anios, valor_residual,
    notas
) VALUES (
    'Licencias y permisos de apertura',
    'Licencia de apertura, licencia de música, permisos municipales',
    'LICENCIAS',
    15000.00,
    '2024-01-01',
    10,
    0.00,
    'Renovación anual de algunos permisos'
);

-- Ejemplos de inversión inicial
INSERT INTO inversion_inicial (
    concepto, descripcion, categoria,
    monto, fecha, forma_pago
) VALUES
    ('Mobiliario completo', '50 mesas + 200 sillas + barras + decoración', 'MOBILIARIO', 35000.00, '2024-01-10', 'TRANSFERENCIA'),
    ('Stock inicial bebidas', 'Inventario inicial de bebidas alcohólicas y refrescos', 'STOCK_INICIAL', 12000.00, '2024-01-20', 'EFECTIVO'),
    ('Sistema TPV y software', 'Sistema punto de venta + licencias software gestión', 'TECNOLOGIA', 8000.00, '2024-01-15', 'TARJETA');

-- ============================================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================================================

COMMENT ON TABLE activos_fijos IS 'Activos fijos de la empresa con cálculo automático de amortizaciones';
COMMENT ON TABLE inversion_inicial IS 'Registro de todas las inversiones iniciales para cálculo de ROI';
COMMENT ON TABLE amortizaciones IS 'Historial mensual de amortizaciones de activos fijos';

COMMENT ON COLUMN activos_fijos.amortizacion_anual IS 'Calculado: (valor_inicial - valor_residual) / vida_util_anios';
COMMENT ON COLUMN activos_fijos.amortizacion_mensual IS 'Calculado: amortizacion_anual / 12';
COMMENT ON COLUMN activos_fijos.amortizacion_acumulada IS 'Calculado: amortizacion_mensual * meses_transcurridos';
COMMENT ON COLUMN activos_fijos.valor_neto IS 'Calculado: valor_inicial - amortizacion_acumulada';

-- ============================================================================
-- FIN DE MIGRACIÓN V015
-- ============================================================================
