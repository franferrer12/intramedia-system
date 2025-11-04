-- =====================================================
-- MIGRACIÓN: Análisis Financiero de DJs
-- Versión: 007
-- Fecha: 2025-10-26
-- Descripción: Vista y funciones para análisis financiero de DJs
-- =====================================================

-- ========================================
-- 1. VISTA: Estadísticas Financieras por DJ
-- ========================================
CREATE OR REPLACE VIEW vw_dj_financial_stats AS
SELECT
  d.id as dj_id,
  d.nombre as dj_nombre,
  d.email as dj_email,
  d.telefono as dj_telefono,
  d.activo as dj_activo,

  -- Cantidad de eventos
  COUNT(e.id) as total_eventos,
  COUNT(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as eventos_ultimo_mes,
  COUNT(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as eventos_ultimo_trimestre,

  -- Horas trabajadas
  SUM(e.horas) as total_horas_trabajadas,
  ROUND(AVG(e.horas)::numeric, 2) as promedio_horas_por_evento,

  -- Ingresos del DJ (lo que cobra)
  SUM(e.parte_dj) as total_cobrado,
  ROUND(AVG(e.parte_dj)::numeric, 2) as promedio_por_evento,

  -- Precio por hora
  CASE
    WHEN SUM(e.horas) > 0
    THEN ROUND((SUM(e.parte_dj) / SUM(e.horas))::numeric, 2)
    ELSE 0
  END as precio_hora_medio,

  -- Últimos 3 meses
  CASE
    WHEN SUM(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '90 days' THEN e.horas ELSE 0 END) > 0
    THEN ROUND(
      (SUM(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '90 days' THEN e.parte_dj ELSE 0 END) /
       SUM(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '90 days' THEN e.horas ELSE 0 END))::numeric, 2
    )
    ELSE 0
  END as precio_hora_ultimo_trimestre,

  -- Estado de pagos
  COUNT(CASE WHEN e.pagado_dj = true THEN 1 END) as eventos_pagados,
  COUNT(CASE WHEN e.pagado_dj = false THEN 1 END) as eventos_pendiente_pago,

  SUM(CASE WHEN e.pagado_dj = true THEN e.parte_dj ELSE 0 END) as total_pagado,
  SUM(CASE WHEN e.pagado_dj = false THEN e.parte_dj ELSE 0 END) as total_pendiente_pago,

  -- Porcentaje de pagos completados
  CASE
    WHEN COUNT(e.id) > 0
    THEN ROUND((COUNT(CASE WHEN e.pagado_dj = true THEN 1 END)::numeric / COUNT(e.id) * 100)::numeric, 2)
    ELSE 0
  END as porcentaje_eventos_pagados,

  -- Rentabilidad para la agencia (beneficio que genera)
  SUM(e.beneficio_bruto) as rentabilidad_total_agencia,
  ROUND(AVG(e.beneficio_bruto)::numeric, 2) as rentabilidad_promedio_evento,

  -- Margen de beneficio (cuánto gana la agencia vs lo que cobra el DJ)
  CASE
    WHEN SUM(e.parte_dj) > 0
    THEN ROUND((SUM(e.beneficio_bruto) / SUM(e.parte_dj) * 100)::numeric, 2)
    ELSE 0
  END as margen_beneficio_porcentaje,

  -- Fechas
  MIN(e.fecha) as primer_evento,
  MAX(e.fecha) as ultimo_evento,

  -- Días desde último evento
  CURRENT_DATE - MAX(e.fecha)::date as dias_desde_ultimo_evento,

  -- Caché total generado (ingreso total de eventos con este DJ)
  SUM(e.cache_total) as cache_total_generado,
  ROUND(AVG(e.cache_total)::numeric, 2) as cache_promedio_evento

FROM djs d
LEFT JOIN eventos e ON d.id = e.dj_id
GROUP BY d.id, d.nombre, d.email, d.telefono, d.activo
ORDER BY total_cobrado DESC NULLS LAST;

-- ========================================
-- 2. VISTA: Top DJs por Rentabilidad
-- ========================================
CREATE OR REPLACE VIEW vw_top_djs_rentabilidad AS
SELECT
  dj_id,
  dj_nombre,
  total_eventos,
  total_cobrado,
  precio_hora_medio,
  rentabilidad_total_agencia,
  margen_beneficio_porcentaje,
  total_pendiente_pago,

  -- Ranking
  ROW_NUMBER() OVER (ORDER BY rentabilidad_total_agencia DESC) as ranking_rentabilidad,
  ROW_NUMBER() OVER (ORDER BY total_eventos DESC) as ranking_eventos,
  ROW_NUMBER() OVER (ORDER BY precio_hora_medio DESC) as ranking_precio_hora

FROM vw_dj_financial_stats
WHERE total_eventos > 0
ORDER BY rentabilidad_total_agencia DESC;

-- ========================================
-- 3. VISTA: DJs con Pagos Pendientes
-- ========================================
CREATE OR REPLACE VIEW vw_djs_pagos_pendientes AS
SELECT
  d.id as dj_id,
  d.nombre as dj_nombre,
  d.email as dj_email,
  d.telefono as dj_telefono,

  e.id as evento_id,
  e.fecha as evento_fecha,
  e.evento as evento_nombre,
  e.parte_dj as monto_pendiente,
  e.horas as horas_trabajadas,

  -- Días de retraso
  CURRENT_DATE - e.fecha::date as dias_pendiente,

  CASE
    WHEN CURRENT_DATE - e.fecha::date > 30 THEN 'Urgente'
    WHEN CURRENT_DATE - e.fecha::date > 15 THEN 'Alta'
    WHEN CURRENT_DATE - e.fecha::date > 7 THEN 'Media'
    ELSE 'Normal'
  END as prioridad_pago

FROM djs d
INNER JOIN eventos e ON d.id = e.dj_id
WHERE e.pagado_dj = false
  AND e.fecha <= CURRENT_DATE
ORDER BY e.fecha ASC;

-- ========================================
-- 4. VISTA: Rendimiento Mensual por DJ
-- ========================================
CREATE OR REPLACE VIEW vw_dj_rendimiento_mensual AS
SELECT
  d.id as dj_id,
  d.nombre as dj_nombre,

  EXTRACT(YEAR FROM e.fecha) as año,
  EXTRACT(MONTH FROM e.fecha) as mes,
  TO_CHAR(e.fecha, 'Month') as mes_nombre,

  COUNT(e.id) as eventos_del_mes,
  SUM(e.horas) as horas_trabajadas,
  SUM(e.parte_dj) as total_cobrado_mes,
  SUM(e.beneficio_bruto) as rentabilidad_agencia_mes,

  ROUND(AVG(e.parte_dj)::numeric, 2) as promedio_por_evento,

  CASE
    WHEN SUM(e.horas) > 0
    THEN ROUND((SUM(e.parte_dj) / SUM(e.horas))::numeric, 2)
    ELSE 0
  END as precio_hora_mes,

  COUNT(CASE WHEN e.pagado_dj = false THEN 1 END) as eventos_pendientes_pago

FROM djs d
INNER JOIN eventos e ON d.id = e.dj_id
GROUP BY
  d.id,
  d.nombre,
  EXTRACT(YEAR FROM e.fecha),
  EXTRACT(MONTH FROM e.fecha),
  TO_CHAR(e.fecha, 'Month')
ORDER BY
  año DESC,
  mes DESC,
  total_cobrado_mes DESC;

-- ========================================
-- 5. FUNCIÓN: Resumen de Pagos Pendientes por DJ
-- ========================================
CREATE OR REPLACE FUNCTION obtener_resumen_pagos_pendientes()
RETURNS TABLE (
  dj_id INTEGER,
  dj_nombre VARCHAR,
  total_pendiente DECIMAL,
  eventos_pendientes BIGINT,
  evento_mas_antiguo DATE,
  dias_maximo_retraso INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.nombre,
    SUM(e.parte_dj)::DECIMAL(10,2),
    COUNT(e.id),
    MIN(e.fecha)::DATE,
    (CURRENT_DATE - MIN(e.fecha)::DATE)::INTEGER
  FROM djs d
  INNER JOIN eventos e ON d.id = e.dj_id
  WHERE e.pagado_dj = false
    AND e.fecha <= CURRENT_DATE
  GROUP BY d.id, d.nombre
  ORDER BY SUM(e.parte_dj) DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON VIEW vw_dj_financial_stats IS 'Estadísticas financieras completas por DJ';
COMMENT ON VIEW vw_top_djs_rentabilidad IS 'Ranking de DJs por rentabilidad para la agencia';
COMMENT ON VIEW vw_djs_pagos_pendientes IS 'Lista de pagos pendientes a DJs con prioridad';
COMMENT ON VIEW vw_dj_rendimiento_mensual IS 'Rendimiento mensual de cada DJ';
COMMENT ON FUNCTION obtener_resumen_pagos_pendientes IS 'Resumen de pagos pendientes agrupados por DJ';

COMMIT;

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
