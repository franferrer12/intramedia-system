-- =====================================================
-- Migración 009: Sistema de Alertas Financieras
-- =====================================================
-- Descripción: Sistema automatizado de alertas para situaciones críticas
-- Autor: Sistema Intra Media
-- Fecha: 2025-10-27
-- =====================================================

-- =====================================================
-- 1. Tipos de Alertas (ENUM)
-- =====================================================
DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM (
    'cobro_critico',
    'cobro_urgente',
    'pago_dj_pendiente',
    'cliente_inactivo',
    'dj_bajo_rendimiento',
    'evento_sin_asignar',
    'rentabilidad_baja',
    'cliente_riesgo_perdida'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM (
    'info',
    'warning',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. Tabla de Alertas
-- =====================================================
CREATE TABLE IF NOT EXISTS financial_alerts (
  id SERIAL PRIMARY KEY,
  alert_type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Referencias opcionales
  evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  dj_id INTEGER REFERENCES djs(id) ON DELETE CASCADE,

  -- Metadata
  data JSONB,

  -- Estado
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_alerts_type ON financial_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON financial_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON financial_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON financial_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_alerts_created ON financial_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_evento ON financial_alerts(evento_id) WHERE evento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_cliente ON financial_alerts(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_dj ON financial_alerts(dj_id) WHERE dj_id IS NOT NULL;

-- =====================================================
-- 3. Función: Generar Alertas de Cobros Vencidos
-- =====================================================
CREATE OR REPLACE FUNCTION generate_cobro_alerts()
RETURNS INTEGER AS $$
DECLARE
  alert_count INTEGER := 0;
  evento_record RECORD;
BEGIN
  -- Alertas críticas (>60 días)
  FOR evento_record IN
    SELECT
      e.id,
      e.evento,
      c.id as cliente_id,
      c.nombre as cliente_nombre,
      e.cache_total,
      CURRENT_DATE - e.fecha::date as dias_pendiente
    FROM eventos e
    JOIN clientes c ON e.cliente_id = c.id
    WHERE e.cobrado_cliente = false
      AND CURRENT_DATE - e.fecha::date > 60
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts fa
        WHERE fa.evento_id = e.id
          AND fa.alert_type = 'cobro_critico'
          AND fa.is_resolved = false
          AND fa.created_at > CURRENT_DATE - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      alert_type,
      severity,
      title,
      message,
      evento_id,
      cliente_id,
      data
    ) VALUES (
      'cobro_critico',
      'critical',
      'Cobro Crítico Vencido',
      format('Evento "%s" del cliente %s lleva %s días sin cobrar. Monto: €%s',
        evento_record.evento,
        evento_record.cliente_nombre,
        evento_record.dias_pendiente,
        evento_record.cache_total
      ),
      evento_record.id,
      evento_record.cliente_id,
      jsonb_build_object(
        'dias_pendiente', evento_record.dias_pendiente,
        'monto', evento_record.cache_total
      )
    );
    alert_count := alert_count + 1;
  END LOOP;

  -- Alertas urgentes (30-60 días)
  FOR evento_record IN
    SELECT
      e.id,
      e.evento,
      c.id as cliente_id,
      c.nombre as cliente_nombre,
      e.cache_total,
      CURRENT_DATE - e.fecha::date as dias_pendiente
    FROM eventos e
    JOIN clientes c ON e.cliente_id = c.id
    WHERE e.cobrado_cliente = false
      AND CURRENT_DATE - e.fecha::date BETWEEN 30 AND 60
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts fa
        WHERE fa.evento_id = e.id
          AND fa.alert_type = 'cobro_urgente'
          AND fa.is_resolved = false
          AND fa.created_at > CURRENT_DATE - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      alert_type,
      severity,
      title,
      message,
      evento_id,
      cliente_id,
      data
    ) VALUES (
      'cobro_urgente',
      'warning',
      'Cobro Urgente Pendiente',
      format('Evento "%s" del cliente %s lleva %s días sin cobrar. Monto: €%s',
        evento_record.evento,
        evento_record.cliente_nombre,
        evento_record.dias_pendiente,
        evento_record.cache_total
      ),
      evento_record.id,
      evento_record.cliente_id,
      jsonb_build_object(
        'dias_pendiente', evento_record.dias_pendiente,
        'monto', evento_record.cache_total
      )
    );
    alert_count := alert_count + 1;
  END LOOP;

  RETURN alert_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Función: Generar Alertas de Pagos a DJs
-- =====================================================
CREATE OR REPLACE FUNCTION generate_pago_dj_alerts()
RETURNS INTEGER AS $$
DECLARE
  alert_count INTEGER := 0;
  evento_record RECORD;
BEGIN
  FOR evento_record IN
    SELECT
      e.id,
      e.evento,
      d.id as dj_id,
      d.nombre as dj_nombre,
      e.parte_dj,
      CURRENT_DATE - e.fecha::date as dias_pendiente
    FROM eventos e
    JOIN djs d ON e.dj_id = d.id
    WHERE e.pagado_dj = false
      AND e.fecha < CURRENT_DATE
      AND CURRENT_DATE - e.fecha::date > 15
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts fa
        WHERE fa.evento_id = e.id
          AND fa.alert_type = 'pago_dj_pendiente'
          AND fa.is_resolved = false
          AND fa.created_at > CURRENT_DATE - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      alert_type,
      severity,
      title,
      message,
      evento_id,
      dj_id,
      data
    ) VALUES (
      'pago_dj_pendiente',
      CASE
        WHEN evento_record.dias_pendiente > 30 THEN 'critical'::alert_severity
        ELSE 'warning'::alert_severity
      END,
      'Pago Pendiente a DJ',
      format('Pago al DJ %s por evento "%s" lleva %s días pendiente. Monto: €%s',
        evento_record.dj_nombre,
        evento_record.evento,
        evento_record.dias_pendiente,
        evento_record.parte_dj
      ),
      evento_record.id,
      evento_record.dj_id,
      jsonb_build_object(
        'dias_pendiente', evento_record.dias_pendiente,
        'monto', evento_record.parte_dj
      )
    );
    alert_count := alert_count + 1;
  END LOOP;

  RETURN alert_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Función: Generar Alertas de Clientes Inactivos
-- =====================================================
CREATE OR REPLACE FUNCTION generate_cliente_inactivo_alerts()
RETURNS INTEGER AS $$
DECLARE
  alert_count INTEGER := 0;
  cliente_record RECORD;
BEGIN
  FOR cliente_record IN
    SELECT
      c.id,
      c.nombre,
      COUNT(e.id) as total_eventos,
      MAX(e.fecha) as ultimo_evento,
      CURRENT_DATE - MAX(e.fecha)::date as dias_inactivo,
      SUM(e.cache_total) as valor_total
    FROM clientes c
    JOIN eventos e ON c.id = e.cliente_id
    WHERE c.activo = true
    GROUP BY c.id, c.nombre
    HAVING COUNT(e.id) >= 5
      AND CURRENT_DATE - MAX(e.fecha)::date > 90
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts fa
        WHERE fa.cliente_id = c.id
          AND fa.alert_type = 'cliente_inactivo'
          AND fa.is_resolved = false
          AND fa.created_at > CURRENT_DATE - INTERVAL '30 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      alert_type,
      severity,
      title,
      message,
      cliente_id,
      data
    ) VALUES (
      'cliente_inactivo',
      'warning',
      'Cliente Valioso Inactivo',
      format('Cliente %s no contrata desde hace %s días. Historial: %s eventos, €%s facturados',
        cliente_record.nombre,
        cliente_record.dias_inactivo,
        cliente_record.total_eventos,
        cliente_record.valor_total
      ),
      cliente_record.id,
      jsonb_build_object(
        'dias_inactivo', cliente_record.dias_inactivo,
        'total_eventos', cliente_record.total_eventos,
        'valor_total', cliente_record.valor_total
      )
    );
    alert_count := alert_count + 1;
  END LOOP;

  RETURN alert_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Función: Generar Alertas de Riesgo de Pérdida
-- =====================================================
CREATE OR REPLACE FUNCTION generate_cliente_riesgo_alerts()
RETURNS INTEGER AS $$
DECLARE
  alert_count INTEGER := 0;
  cliente_record RECORD;
BEGIN
  FOR cliente_record IN
    SELECT * FROM vw_clientes_fidelidad
    WHERE riesgo_perdida = 'Alto'
      AND total_eventos >= 10
      AND NOT EXISTS (
        SELECT 1 FROM financial_alerts fa
        WHERE fa.cliente_id = cliente_id
          AND fa.alert_type = 'cliente_riesgo_perdida'
          AND fa.is_resolved = false
          AND fa.created_at > CURRENT_DATE - INTERVAL '30 days'
      )
  LOOP
    INSERT INTO financial_alerts (
      alert_type,
      severity,
      title,
      message,
      cliente_id,
      data
    ) VALUES (
      'cliente_riesgo_perdida',
      'critical',
      'Cliente en Riesgo de Pérdida',
      format('Cliente %s (%s) lleva más de 6 meses sin actividad. Nivel: %s, Valor total: €%s',
        cliente_record.cliente_nombre,
        cliente_record.cliente_ciudad,
        cliente_record.nivel_fidelidad,
        cliente_record.valor_total_cliente
      ),
      cliente_record.cliente_id,
      jsonb_build_object(
        'nivel_fidelidad', cliente_record.nivel_fidelidad,
        'total_eventos', cliente_record.total_eventos,
        'valor_total', cliente_record.valor_total_cliente,
        'rentabilidad', cliente_record.rentabilidad_total
      )
    );
    alert_count := alert_count + 1;
  END LOOP;

  RETURN alert_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Función Principal: Generar Todas las Alertas
-- =====================================================
CREATE OR REPLACE FUNCTION generate_all_financial_alerts()
RETURNS TABLE (
  alert_type TEXT,
  count INTEGER
) AS $$
DECLARE
  cobros_count INTEGER;
  pagos_count INTEGER;
  inactivos_count INTEGER;
  riesgo_count INTEGER;
BEGIN
  -- Generar alertas de cobros
  cobros_count := generate_cobro_alerts();

  -- Generar alertas de pagos a DJs
  pagos_count := generate_pago_dj_alerts();

  -- Generar alertas de clientes inactivos
  inactivos_count := generate_cliente_inactivo_alerts();

  -- Generar alertas de riesgo de pérdida
  riesgo_count := generate_cliente_riesgo_alerts();

  -- Retornar resumen
  RETURN QUERY
  SELECT 'cobros_vencidos'::TEXT, cobros_count
  UNION ALL
  SELECT 'pagos_djs'::TEXT, pagos_count
  UNION ALL
  SELECT 'clientes_inactivos'::TEXT, inactivos_count
  UNION ALL
  SELECT 'clientes_riesgo'::TEXT, riesgo_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Vista: Resumen de Alertas
-- =====================================================
CREATE OR REPLACE VIEW vw_alerts_summary AS
SELECT
  alert_type,
  severity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE is_resolved = false) as unresolved,
  MAX(created_at) as latest_alert
FROM financial_alerts
WHERE is_resolved = false
GROUP BY alert_type, severity
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END,
  total DESC;

-- =====================================================
-- 9. Vista: Alertas Activas
-- =====================================================
CREATE OR REPLACE VIEW vw_active_alerts AS
SELECT
  fa.*,
  c.nombre as cliente_nombre,
  c.email as cliente_email,
  d.nombre as dj_nombre,
  d.email as dj_email,
  e.evento as evento_nombre,
  e.fecha as evento_fecha
FROM financial_alerts fa
LEFT JOIN clientes c ON fa.cliente_id = c.id
LEFT JOIN djs d ON fa.dj_id = d.id
LEFT JOIN eventos e ON fa.evento_id = e.id
WHERE fa.is_resolved = false
ORDER BY
  CASE fa.severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END,
  fa.created_at DESC;

-- =====================================================
-- 10. Trigger: Auto-resolver alertas cuando se resuelve el problema
-- =====================================================

-- Auto-resolver alertas de cobro cuando se marca como cobrado
CREATE OR REPLACE FUNCTION auto_resolve_cobro_alerts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cobrado_cliente = true AND OLD.cobrado_cliente = false THEN
    UPDATE financial_alerts
    SET
      is_resolved = true,
      resolved_at = CURRENT_TIMESTAMP
    WHERE evento_id = NEW.id
      AND alert_type IN ('cobro_critico', 'cobro_urgente')
      AND is_resolved = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_resolve_cobro_alerts
  AFTER UPDATE ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION auto_resolve_cobro_alerts();

-- Auto-resolver alertas de pago DJ cuando se marca como pagado
CREATE OR REPLACE FUNCTION auto_resolve_pago_dj_alerts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pagado_dj = true AND OLD.pagado_dj = false THEN
    UPDATE financial_alerts
    SET
      is_resolved = true,
      resolved_at = CURRENT_TIMESTAMP
    WHERE evento_id = NEW.id
      AND alert_type = 'pago_dj_pendiente'
      AND is_resolved = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_resolve_pago_dj_alerts
  AFTER UPDATE ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION auto_resolve_pago_dj_alerts();

-- =====================================================
-- Comentarios
-- =====================================================
COMMENT ON TABLE financial_alerts IS 'Sistema de alertas financieras automatizadas';
COMMENT ON VIEW vw_alerts_summary IS 'Resumen de alertas por tipo y severidad';
COMMENT ON VIEW vw_active_alerts IS 'Alertas activas con información relacionada';
COMMENT ON FUNCTION generate_all_financial_alerts IS 'Genera todas las alertas financieras automáticamente';

-- =====================================================
-- Fin de migración 009
-- =====================================================
