-- =====================================================
-- MIGRACIÓN: Sistema de Distribución de Beneficios
-- Versión: 005
-- Fecha: 2025-01-26
-- Descripción: Sistema de distribución de ganancias entre socios y gastos
-- =====================================================

-- ========================================
-- 1. AGREGAR CAMPOS FINANCIEROS A EVENTOS
-- ========================================
ALTER TABLE eventos
  -- Costos detallados
  ADD COLUMN IF NOT EXISTS costo_alquiler DECIMAL(10,2) DEFAULT 0 CHECK (costo_alquiler >= 0),
  ADD COLUMN IF NOT EXISTS otros_costos DECIMAL(10,2) DEFAULT 0 CHECK (otros_costos >= 0),
  ADD COLUMN IF NOT EXISTS descripcion_costos TEXT,

  -- Cálculos automáticos (se calculan con trigger)
  ADD COLUMN IF NOT EXISTS beneficio_bruto DECIMAL(10,2) GENERATED ALWAYS AS (
    parte_agencia - COALESCE(costo_alquiler, 0) - COALESCE(otros_costos, 0)
  ) STORED,

  -- Distribución del beneficio bruto
  ADD COLUMN IF NOT EXISTS monto_gastos_fijos DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_inversion DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_socios DECIMAL(10,2) DEFAULT 0,

  -- Distribución por socio (se calcula con trigger basado en monto_socios)
  ADD COLUMN IF NOT EXISTS monto_fran DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_roberto DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_pablo DECIMAL(10,2) DEFAULT 0;

-- Índices para consultas financieras
CREATE INDEX IF NOT EXISTS idx_eventos_beneficio_bruto ON eventos(beneficio_bruto DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_financiero ON eventos(fecha, beneficio_bruto);

-- ========================================
-- 2. TABLA DE CONFIGURACIÓN DE DISTRIBUCIÓN
-- ========================================
CREATE TABLE IF NOT EXISTS profit_distribution_config (
  id SERIAL PRIMARY KEY,

  -- Identificador único (solo habrá 1 registro activo)
  nombre VARCHAR(100) DEFAULT 'Configuración Principal' UNIQUE,
  activo BOOLEAN DEFAULT TRUE,

  -- Porcentajes de distribución del beneficio bruto
  porcentaje_gastos_fijos DECIMAL(5,2) DEFAULT 30.00 CHECK (porcentaje_gastos_fijos >= 0 AND porcentaje_gastos_fijos <= 100),
  porcentaje_inversion DECIMAL(5,2) DEFAULT 20.00 CHECK (porcentaje_inversion >= 0 AND porcentaje_inversion <= 100),
  porcentaje_socios DECIMAL(5,2) DEFAULT 50.00 CHECK (porcentaje_socios >= 0 AND porcentaje_socios <= 100),

  -- Distribución entre socios (del porcentaje_socios, cómo se divide)
  porcentaje_fran DECIMAL(5,2) DEFAULT 33.33 CHECK (porcentaje_fran >= 0 AND porcentaje_fran <= 100),
  porcentaje_roberto DECIMAL(5,2) DEFAULT 33.33 CHECK (porcentaje_roberto >= 0 AND porcentaje_roberto <= 100),
  porcentaje_pablo DECIMAL(5,2) DEFAULT 33.34 CHECK (porcentaje_pablo >= 0 AND porcentaje_pablo <= 100),

  -- Validación: suma total debe ser 100%
  CONSTRAINT check_total_distribucion CHECK (
    porcentaje_gastos_fijos + porcentaje_inversion + porcentaje_socios = 100
  ),
  CONSTRAINT check_total_socios CHECK (
    ABS(porcentaje_fran + porcentaje_roberto + porcentaje_pablo - 100) < 0.01
  ),

  -- Descripción de cada concepto
  descripcion_gastos_fijos TEXT DEFAULT 'Gastos operativos: oficina, servicios, seguros, etc.',
  descripcion_inversion TEXT DEFAULT 'Reinversión en equipamiento, marketing, desarrollo',
  descripcion_socios TEXT DEFAULT 'Distribución de beneficios entre los 3 socios',

  -- Auditoría
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  actualizado_por INTEGER REFERENCES usuarios(id)
);

-- Solo puede haber una configuración activa
CREATE UNIQUE INDEX idx_profit_config_active ON profit_distribution_config(activo) WHERE activo = TRUE;

-- ========================================
-- 3. INSERTAR CONFIGURACIÓN POR DEFECTO
-- ========================================
INSERT INTO profit_distribution_config (
  nombre,
  porcentaje_gastos_fijos,
  porcentaje_inversion,
  porcentaje_socios,
  porcentaje_fran,
  porcentaje_roberto,
  porcentaje_pablo
) VALUES (
  'Configuración Principal',
  30.00,  -- 30% gastos fijos
  20.00,  -- 20% inversión
  50.00,  -- 50% socios
  33.33,  -- Fran 33.33%
  33.33,  -- Roberto 33.33%
  33.34   -- Pablo 33.34%
) ON CONFLICT (nombre) DO NOTHING;

-- ========================================
-- 4. FUNCIÓN: Calcular distribución de beneficios
-- ========================================
CREATE OR REPLACE FUNCTION calcular_distribucion_beneficio()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
  v_beneficio_bruto DECIMAL(10,2);
BEGIN
  -- Obtener configuración activa
  SELECT * INTO v_config
  FROM profit_distribution_config
  WHERE activo = TRUE
  LIMIT 1;

  -- Si no hay configuración, usar valores por defecto
  IF v_config IS NULL THEN
    v_config.porcentaje_gastos_fijos := 30.00;
    v_config.porcentaje_inversion := 20.00;
    v_config.porcentaje_socios := 50.00;
    v_config.porcentaje_fran := 33.33;
    v_config.porcentaje_roberto := 33.33;
    v_config.porcentaje_pablo := 33.34;
  END IF;

  -- Calcular beneficio bruto manualmente (no usar GENERATED porque estamos en trigger)
  v_beneficio_bruto := NEW.parte_agencia - COALESCE(NEW.costo_alquiler, 0) - COALESCE(NEW.otros_costos, 0);

  -- Calcular distribuciones
  NEW.monto_gastos_fijos := ROUND((v_beneficio_bruto * v_config.porcentaje_gastos_fijos / 100)::numeric, 2);
  NEW.monto_inversion := ROUND((v_beneficio_bruto * v_config.porcentaje_inversion / 100)::numeric, 2);
  NEW.monto_socios := ROUND((v_beneficio_bruto * v_config.porcentaje_socios / 100)::numeric, 2);

  -- Distribuir entre socios
  NEW.monto_fran := ROUND((NEW.monto_socios * v_config.porcentaje_fran / 100)::numeric, 2);
  NEW.monto_roberto := ROUND((NEW.monto_socios * v_config.porcentaje_roberto / 100)::numeric, 2);
  NEW.monto_pablo := ROUND((NEW.monto_socios * v_config.porcentaje_pablo / 100)::numeric, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. TRIGGER: Aplicar distribución automáticamente
-- ========================================
CREATE TRIGGER trigger_calcular_distribucion_beneficio
  BEFORE INSERT OR UPDATE OF parte_agencia, costo_alquiler, otros_costos
  ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION calcular_distribucion_beneficio();

-- ========================================
-- 6. VISTA: Resumen Financiero por Evento
-- ========================================
CREATE OR REPLACE VIEW vw_eventos_desglose_financiero AS
SELECT
  e.id,
  e.fecha,
  e.evento,
  e.cliente_id,
  c.nombre as cliente_nombre,
  e.dj_id,
  d.nombre as dj_nombre,

  -- Ingresos
  e.cache_total as ingreso_total,

  -- Costos
  e.parte_dj as costo_dj,
  e.costo_alquiler,
  e.otros_costos,
  (e.parte_dj + COALESCE(e.costo_alquiler, 0) + COALESCE(e.otros_costos, 0)) as costos_totales,

  -- Beneficio agencia
  e.parte_agencia as beneficio_agencia_bruto,
  e.beneficio_bruto,

  -- Distribución del beneficio bruto
  e.monto_gastos_fijos,
  e.monto_inversion,
  e.monto_socios,

  -- Por socio
  e.monto_fran,
  e.monto_roberto,
  e.monto_pablo,

  -- Porcentajes calculados
  CASE
    WHEN e.cache_total > 0
    THEN ROUND((e.beneficio_bruto / e.cache_total * 100)::numeric, 2)
    ELSE 0
  END as margen_beneficio_porcentaje,

  -- Estado de pagos
  e.cobrado_cliente,
  e.pagado_dj,

  CASE
    WHEN e.cobrado_cliente AND e.pagado_dj THEN 'Liquidado'
    WHEN e.cobrado_cliente AND NOT e.pagado_dj THEN 'Cobrado - Pendiente pagar DJ'
    WHEN NOT e.cobrado_cliente AND e.pagado_dj THEN 'DJ Pagado - Pendiente cobrar'
    ELSE 'Pendiente todo'
  END as estado_financiero

FROM eventos e
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN djs d ON e.dj_id = d.id
ORDER BY e.fecha DESC;

-- ========================================
-- 7. VISTA: Resumen Total por Periodo
-- ========================================
CREATE OR REPLACE VIEW vw_resumen_financiero_mensual AS
SELECT
  EXTRACT(YEAR FROM e.fecha) as año,
  EXTRACT(MONTH FROM e.fecha) as mes_numero,
  e.mes as mes_nombre,

  -- Totales de eventos
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN e.cobrado_cliente THEN 1 END) as eventos_cobrados,
  COUNT(CASE WHEN e.pagado_dj THEN 1 END) as eventos_dj_pagado,

  -- Ingresos
  SUM(e.cache_total) as ingresos_totales,
  SUM(CASE WHEN e.cobrado_cliente THEN e.cache_total ELSE 0 END) as ingresos_cobrados,
  SUM(CASE WHEN NOT e.cobrado_cliente THEN e.cache_total ELSE 0 END) as ingresos_pendientes,

  -- Costos
  SUM(e.parte_dj) as total_costo_djs,
  SUM(e.costo_alquiler) as total_costo_alquiler,
  SUM(e.otros_costos) as total_otros_costos,

  -- Beneficios
  SUM(e.beneficio_bruto) as beneficio_bruto_total,

  -- Distribución
  SUM(e.monto_gastos_fijos) as total_gastos_fijos,
  SUM(e.monto_inversion) as total_inversion,
  SUM(e.monto_socios) as total_socios,

  -- Por socio
  SUM(e.monto_fran) as total_fran,
  SUM(e.monto_roberto) as total_roberto,
  SUM(e.monto_pablo) as total_pablo,

  -- Métricas
  CASE
    WHEN SUM(e.cache_total) > 0
    THEN ROUND((SUM(e.beneficio_bruto) / SUM(e.cache_total) * 100)::numeric, 2)
    ELSE 0
  END as margen_beneficio_porcentaje,

  ROUND(AVG(e.beneficio_bruto)::numeric, 2) as beneficio_promedio_evento

FROM eventos e
GROUP BY
  EXTRACT(YEAR FROM e.fecha),
  EXTRACT(MONTH FROM e.fecha),
  e.mes
ORDER BY año DESC, mes_numero DESC;

-- ========================================
-- 8. VISTA: Resumen por Socio
-- ========================================
CREATE OR REPLACE VIEW vw_resumen_por_socio AS
SELECT
  'Fran' as socio,
  SUM(e.monto_fran) as total_acumulado,
  COUNT(*) as eventos_contabilizados,
  ROUND(AVG(e.monto_fran)::numeric, 2) as promedio_por_evento,
  MIN(e.fecha) as primer_evento,
  MAX(e.fecha) as ultimo_evento
FROM eventos e
WHERE e.beneficio_bruto > 0

UNION ALL

SELECT
  'Roberto' as socio,
  SUM(e.monto_roberto) as total_acumulado,
  COUNT(*) as eventos_contabilizados,
  ROUND(AVG(e.monto_roberto)::numeric, 2) as promedio_por_evento,
  MIN(e.fecha) as primer_evento,
  MAX(e.fecha) as ultimo_evento
FROM eventos e
WHERE e.beneficio_bruto > 0

UNION ALL

SELECT
  'Pablo' as socio,
  SUM(e.monto_pablo) as total_acumulado,
  COUNT(*) as eventos_contabilizados,
  ROUND(AVG(e.monto_pablo)::numeric, 2) as promedio_por_evento,
  MIN(e.fecha) as primer_evento,
  MAX(e.fecha) as ultimo_evento
FROM eventos e
WHERE e.beneficio_bruto > 0;

-- ========================================
-- 9. FUNCIÓN: Recalcular todos los eventos
-- ========================================
CREATE OR REPLACE FUNCTION recalcular_distribucion_todos_eventos()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Forzar recálculo actualizando todos los eventos
  UPDATE eventos
  SET parte_agencia = parte_agencia -- Trigger se dispara con cualquier UPDATE
  WHERE TRUE;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 10. TRIGGER: Auditoría de cambios en config
-- ========================================
CREATE OR REPLACE FUNCTION update_profit_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profit_config_timestamp
  BEFORE UPDATE ON profit_distribution_config
  FOR EACH ROW
  EXECUTE FUNCTION update_profit_config_timestamp();

-- ========================================
-- COMENTARIOS EN TABLAS Y CAMPOS
-- ========================================
COMMENT ON TABLE profit_distribution_config IS 'Configuración de distribución de beneficios entre gastos, inversión y socios';
COMMENT ON COLUMN eventos.costo_alquiler IS 'Costo de alquiler de equipos o locales';
COMMENT ON COLUMN eventos.otros_costos IS 'Otros costos asociados al evento';
COMMENT ON COLUMN eventos.beneficio_bruto IS 'Beneficio después de restar costos (parte_agencia - costos)';
COMMENT ON COLUMN eventos.monto_gastos_fijos IS 'Monto destinado a gastos fijos de la empresa';
COMMENT ON COLUMN eventos.monto_inversion IS 'Monto destinado a inversión y desarrollo';
COMMENT ON COLUMN eventos.monto_socios IS 'Monto total a distribuir entre los 3 socios';
COMMENT ON VIEW vw_eventos_desglose_financiero IS 'Vista completa del desglose financiero de cada evento';
COMMENT ON VIEW vw_resumen_financiero_mensual IS 'Resumen financiero agrupado por mes';
COMMENT ON VIEW vw_resumen_por_socio IS 'Resumen de beneficios acumulados por cada socio';

-- ========================================
-- RECALCULAR EVENTOS EXISTENTES
-- ========================================
SELECT recalcular_distribucion_todos_eventos();

COMMIT;

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
