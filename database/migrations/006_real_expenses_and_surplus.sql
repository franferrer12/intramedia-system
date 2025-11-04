-- =====================================================
-- MIGRACIÓN: Gastos Reales y Redistribución de Excedentes
-- Versión: 006
-- Fecha: 2025-01-26
-- Descripción: Sistema para registrar gastos reales y redistribuir excedentes
-- =====================================================

-- ========================================
-- 1. TABLA: monthly_expenses
-- Registro de gastos fijos reales mensuales
-- ========================================
CREATE TABLE IF NOT EXISTS monthly_expenses (
  id SERIAL PRIMARY KEY,

  -- Periodo
  año INTEGER NOT NULL CHECK (año >= 2020 AND año <= 2100),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  mes_nombre VARCHAR(20),

  -- Presupuestado (calculado automáticamente de eventos del mes)
  presupuesto_gastos_fijos DECIMAL(10,2) DEFAULT 0,
  presupuesto_inversion DECIMAL(10,2) DEFAULT 0,
  presupuesto_socios DECIMAL(10,2) DEFAULT 0,

  -- Real (ingresado manualmente)
  gastos_fijos_reales DECIMAL(10,2) DEFAULT 0 CHECK (gastos_fijos_reales >= 0),
  inversion_real DECIMAL(10,2) DEFAULT 0 CHECK (inversion_real >= 0),

  -- Excedentes calculados
  excedente_gastos_fijos DECIMAL(10,2) GENERATED ALWAYS AS (
    presupuesto_gastos_fijos - COALESCE(gastos_fijos_reales, 0)
  ) STORED,
  excedente_inversion DECIMAL(10,2) GENERATED ALWAYS AS (
    presupuesto_inversion - COALESCE(inversion_real, 0)
  ) STORED,
  excedente_total DECIMAL(10,2) GENERATED ALWAYS AS (
    (presupuesto_gastos_fijos - COALESCE(gastos_fijos_reales, 0)) +
    (presupuesto_inversion - COALESCE(inversion_real, 0))
  ) STORED,

  -- Redistribución del excedente
  redistribucion_realizada BOOLEAN DEFAULT FALSE,
  excedente_a_socios DECIMAL(10,2) DEFAULT 0, -- Cuánto del excedente va a socios
  excedente_a_fran DECIMAL(10,2) DEFAULT 0,
  excedente_a_roberto DECIMAL(10,2) DEFAULT 0,
  excedente_a_pablo DECIMAL(10,2) DEFAULT 0,

  -- Totales finales (presupuesto + excedente)
  total_final_fran DECIMAL(10,2) DEFAULT 0,
  total_final_roberto DECIMAL(10,2) DEFAULT 0,
  total_final_pablo DECIMAL(10,2) DEFAULT 0,

  -- Detalles de gastos
  desglose_gastos JSONB DEFAULT '[]'::jsonb, -- [{concepto: 'Oficina', monto: 500}, ...]
  notas TEXT,

  -- Estado
  cerrado BOOLEAN DEFAULT FALSE, -- Si está cerrado, no se puede editar
  fecha_cierre TIMESTAMP,

  -- Auditoría
  registrado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),

  -- No permitir duplicados
  UNIQUE(año, mes)
);

-- Índices
CREATE INDEX idx_monthly_expenses_periodo ON monthly_expenses(año DESC, mes DESC);
CREATE INDEX idx_monthly_expenses_cerrado ON monthly_expenses(cerrado);

-- ========================================
-- 2. FUNCIÓN: Calcular presupuestos del mes
-- ========================================
CREATE OR REPLACE FUNCTION calcular_presupuesto_mes(p_año INTEGER, p_mes INTEGER)
RETURNS void AS $$
DECLARE
  v_total_gastos_fijos DECIMAL(10,2);
  v_total_inversion DECIMAL(10,2);
  v_total_socios DECIMAL(10,2);
BEGIN
  -- Sumar de todos los eventos del mes
  SELECT
    COALESCE(SUM(monto_gastos_fijos), 0),
    COALESCE(SUM(monto_inversion), 0),
    COALESCE(SUM(monto_socios), 0)
  INTO
    v_total_gastos_fijos,
    v_total_inversion,
    v_total_socios
  FROM eventos
  WHERE EXTRACT(YEAR FROM fecha) = p_año
    AND EXTRACT(MONTH FROM fecha) = p_mes;

  -- Insertar o actualizar registro mensual
  INSERT INTO monthly_expenses (
    año, mes, mes_nombre,
    presupuesto_gastos_fijos,
    presupuesto_inversion,
    presupuesto_socios
  )
  VALUES (
    p_año, p_mes,
    TO_CHAR(TO_DATE(p_mes::text, 'MM'), 'Month'),
    v_total_gastos_fijos,
    v_total_inversion,
    v_total_socios
  )
  ON CONFLICT (año, mes) DO UPDATE SET
    presupuesto_gastos_fijos = EXCLUDED.presupuesto_gastos_fijos,
    presupuesto_inversion = EXCLUDED.presupuesto_inversion,
    presupuesto_socios = EXCLUDED.presupuesto_socios,
    fecha_actualizacion = NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. FUNCIÓN: Redistribuir excedente a socios
-- ========================================
CREATE OR REPLACE FUNCTION redistribuir_excedente(p_año INTEGER, p_mes INTEGER)
RETURNS void AS $$
DECLARE
  v_config RECORD;
  v_excedente_total DECIMAL(10,2);
  v_presupuesto_socios DECIMAL(10,2);
  v_excedente_a_socios DECIMAL(10,2);
BEGIN
  -- Obtener configuración de distribución
  SELECT * INTO v_config
  FROM profit_distribution_config
  WHERE activo = TRUE
  LIMIT 1;

  -- Obtener datos del mes
  SELECT excedente_total, presupuesto_socios
  INTO v_excedente_total, v_presupuesto_socios
  FROM monthly_expenses
  WHERE año = p_año AND mes = p_mes;

  -- Por defecto, todo el excedente va a socios
  v_excedente_a_socios := v_excedente_total;

  -- Calcular redistribución entre socios (mismos % que configuración)
  UPDATE monthly_expenses SET
    excedente_a_socios = v_excedente_a_socios,
    excedente_a_fran = ROUND((v_excedente_a_socios * v_config.porcentaje_fran / 100)::numeric, 2),
    excedente_a_roberto = ROUND((v_excedente_a_socios * v_config.porcentaje_roberto / 100)::numeric, 2),
    excedente_a_pablo = ROUND((v_excedente_a_socios * v_config.porcentaje_pablo / 100)::numeric, 2),
    redistribucion_realizada = TRUE,
    fecha_actualizacion = NOW()
  WHERE año = p_año AND mes = p_mes;

  -- Calcular totales finales
  UPDATE monthly_expenses me SET
    total_final_fran = (
      SELECT COALESCE(SUM(monto_fran), 0)
      FROM eventos
      WHERE EXTRACT(YEAR FROM fecha) = p_año AND EXTRACT(MONTH FROM fecha) = p_mes
    ) + me.excedente_a_fran,
    total_final_roberto = (
      SELECT COALESCE(SUM(monto_roberto), 0)
      FROM eventos
      WHERE EXTRACT(YEAR FROM fecha) = p_año AND EXTRACT(MONTH FROM fecha) = p_mes
    ) + me.excedente_a_roberto,
    total_final_pablo = (
      SELECT COALESCE(SUM(monto_pablo), 0)
      FROM eventos
      WHERE EXTRACT(YEAR FROM fecha) = p_año AND EXTRACT(MONTH FROM fecha) = p_mes
    ) + me.excedente_a_pablo
  WHERE año = p_año AND mes = p_mes;

END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. FUNCIÓN: Cerrar mes (no permite más cambios)
-- ========================================
CREATE OR REPLACE FUNCTION cerrar_mes(p_año INTEGER, p_mes INTEGER)
RETURNS void AS $$
BEGIN
  -- Primero redistribuir si no se ha hecho
  PERFORM redistribuir_excedente(p_año, p_mes);

  -- Marcar como cerrado
  UPDATE monthly_expenses SET
    cerrado = TRUE,
    fecha_cierre = NOW(),
    fecha_actualizacion = NOW()
  WHERE año = p_año AND mes = p_mes;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. VISTA: Comparativa Presupuesto vs Real
-- ========================================
CREATE OR REPLACE VIEW vw_budget_vs_real AS
SELECT
  me.año,
  me.mes,
  me.mes_nombre,

  -- Presupuestado
  me.presupuesto_gastos_fijos,
  me.presupuesto_inversion,
  me.presupuesto_socios,

  -- Real
  me.gastos_fijos_reales,
  me.inversion_real,

  -- Excedentes
  me.excedente_gastos_fijos,
  me.excedente_inversion,
  me.excedente_total,

  -- Estado de redistribución
  me.redistribucion_realizada,
  me.excedente_a_socios,

  -- Distribución original de socios (sin excedente)
  (SELECT COALESCE(SUM(monto_fran), 0)
   FROM eventos
   WHERE EXTRACT(YEAR FROM fecha) = me.año AND EXTRACT(MONTH FROM fecha) = me.mes
  ) as presupuesto_fran,

  (SELECT COALESCE(SUM(monto_roberto), 0)
   FROM eventos
   WHERE EXTRACT(YEAR FROM fecha) = me.año AND EXTRACT(MONTH FROM fecha) = me.mes
  ) as presupuesto_roberto,

  (SELECT COALESCE(SUM(monto_pablo), 0)
   FROM eventos
   WHERE EXTRACT(YEAR FROM fecha) = me.año AND EXTRACT(MONTH FROM fecha) = me.mes
  ) as presupuesto_pablo,

  -- Excedente por socio
  me.excedente_a_fran,
  me.excedente_a_roberto,
  me.excedente_a_pablo,

  -- Totales finales
  me.total_final_fran,
  me.total_final_roberto,
  me.total_final_pablo,

  -- Porcentajes de ahorro
  CASE
    WHEN me.presupuesto_gastos_fijos > 0
    THEN ROUND((me.excedente_gastos_fijos / me.presupuesto_gastos_fijos * 100)::numeric, 2)
    ELSE 0
  END as ahorro_gastos_porcentaje,

  CASE
    WHEN me.presupuesto_inversion > 0
    THEN ROUND((me.excedente_inversion / me.presupuesto_inversion * 100)::numeric, 2)
    ELSE 0
  END as ahorro_inversion_porcentaje,

  -- Estado
  me.cerrado,
  me.fecha_cierre

FROM monthly_expenses me
ORDER BY me.año DESC, me.mes DESC;

-- ========================================
-- 6. TRIGGER: Actualizar timestamp
-- ========================================
CREATE OR REPLACE FUNCTION update_monthly_expenses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_expenses_timestamp
  BEFORE UPDATE ON monthly_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_expenses_timestamp();

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE monthly_expenses IS 'Registro de gastos reales mensuales y redistribución de excedentes';
COMMENT ON COLUMN monthly_expenses.excedente_total IS 'Total de ahorro (presupuesto - real)';
COMMENT ON COLUMN monthly_expenses.excedente_a_socios IS 'Cuánto del excedente se redistribuye a socios';
COMMENT ON COLUMN monthly_expenses.cerrado IS 'Si TRUE, no se puede modificar (mes cerrado)';
COMMENT ON VIEW vw_budget_vs_real IS 'Vista comparativa de presupuesto vs gastos reales con excedentes';

COMMIT;

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
