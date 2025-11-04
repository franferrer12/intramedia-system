-- =====================================================
-- Migración 008: Análisis Financiero de Clientes
-- =====================================================
-- Descripción: Vistas y funciones para análisis financiero completo de clientes
-- Autor: Sistema Intra Media
-- Fecha: 2025-10-27
-- =====================================================

-- =====================================================
-- 1. Vista: Estadísticas Financieras de Clientes
-- =====================================================
CREATE OR REPLACE VIEW vw_cliente_financial_stats AS
SELECT
  c.id as cliente_id,
  c.nombre as cliente_nombre,
  c.email as cliente_email,
  c.telefono as cliente_telefono,
  c.ciudad as cliente_ciudad,
  c.activo as cliente_activo,

  -- Métricas de eventos
  COUNT(e.id) as total_eventos,
  COUNT(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END) as eventos_ultimo_mes,
  COUNT(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '3 months' THEN 1 END) as eventos_ultimo_trimestre,
  COUNT(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as eventos_ultimo_año,

  -- Métricas financieras
  SUM(e.cache_total) as facturacion_total,
  CASE WHEN COUNT(e.id) > 0 THEN ROUND((SUM(e.cache_total) / COUNT(e.id))::numeric, 2) ELSE 0 END as precio_medio_evento,
  MAX(e.cache_total) as evento_mas_caro,
  MIN(e.cache_total) as evento_mas_barato,

  -- Comisiones y rentabilidad agencia
  SUM(e.parte_agencia) as comision_total_agencia,
  CASE WHEN COUNT(e.id) > 0 THEN ROUND((SUM(e.parte_agencia) / COUNT(e.id))::numeric, 2) ELSE 0 END as comision_promedio_evento,

  -- Estado de cobros
  SUM(CASE WHEN e.cobrado_cliente = true THEN e.cache_total ELSE 0 END) as total_cobrado,
  SUM(CASE WHEN e.cobrado_cliente = false THEN e.cache_total ELSE 0 END) as total_pendiente_cobro,
  COUNT(CASE WHEN e.cobrado_cliente = false THEN 1 END) as eventos_pendiente_cobro,

  -- Porcentajes
  CASE
    WHEN COUNT(e.id) > 0 THEN
      ROUND((COUNT(CASE WHEN e.cobrado_cliente = true THEN 1 END)::numeric / COUNT(e.id)::numeric * 100), 1)
    ELSE 0
  END as porcentaje_eventos_cobrados,

  -- Frecuencia y actividad
  MAX(e.fecha) as ultimo_evento_fecha,
  MIN(e.fecha) as primer_evento_fecha,
  CASE
    WHEN MAX(e.fecha) IS NOT NULL THEN CURRENT_DATE - MAX(e.fecha)::date
    ELSE NULL
  END as dias_desde_ultimo_evento,

  -- Cálculo de frecuencia (eventos por mes en promedio)
  CASE
    WHEN MAX(e.fecha) IS NOT NULL AND MIN(e.fecha) IS NOT NULL AND MAX(e.fecha) != MIN(e.fecha) THEN
      ROUND(
        (COUNT(e.id)::numeric / GREATEST(1, (MAX(e.fecha)::date - MIN(e.fecha)::date) / 30.0))::numeric,
        2
      )
    WHEN COUNT(e.id) = 1 THEN 1
    ELSE 0
  END as eventos_por_mes_promedio,

  -- DJs únicos contratados
  COUNT(DISTINCT e.dj_id) as total_djs_contratados,

  -- Clasificación del cliente
  CASE
    WHEN COUNT(e.id) >= 20 THEN 'VIP'
    WHEN COUNT(e.id) >= 10 THEN 'Premium'
    WHEN COUNT(e.id) >= 5 THEN 'Regular'
    WHEN COUNT(e.id) > 0 THEN 'Nuevo'
    ELSE 'Sin eventos'
  END as clasificacion_cliente,

  -- Estado de actividad
  CASE
    WHEN MAX(e.fecha) >= CURRENT_DATE - INTERVAL '1 month' THEN 'Muy activo'
    WHEN MAX(e.fecha) >= CURRENT_DATE - INTERVAL '3 months' THEN 'Activo'
    WHEN MAX(e.fecha) >= CURRENT_DATE - INTERVAL '6 months' THEN 'Inactivo'
    WHEN MAX(e.fecha) IS NOT NULL THEN 'Muy inactivo'
    ELSE 'Sin actividad'
  END as estado_actividad

FROM clientes c
LEFT JOIN eventos e ON c.id = e.cliente_id
GROUP BY c.id, c.nombre, c.email, c.telefono, c.ciudad, c.activo
ORDER BY facturacion_total DESC NULLS LAST;

-- =====================================================
-- 2. Vista: Clientes con Cobros Pendientes
-- =====================================================
CREATE OR REPLACE VIEW vw_clientes_cobros_pendientes AS
SELECT
  c.id as cliente_id,
  c.nombre as cliente_nombre,
  c.email as cliente_email,
  c.telefono as cliente_telefono,
  e.id as evento_id,
  e.evento as evento_nombre,
  d.nombre as dj_nombre,
  e.fecha as evento_fecha,
  e.cache_total as monto_pendiente,
  e.parte_agencia as comision_pendiente,
  CURRENT_DATE - e.fecha::date as dias_pendiente,

  -- Prioridad de cobro
  CASE
    WHEN CURRENT_DATE - e.fecha::date > 60 THEN 'Crítica'
    WHEN CURRENT_DATE - e.fecha::date > 30 THEN 'Urgente'
    WHEN CURRENT_DATE - e.fecha::date > 15 THEN 'Alta'
    ELSE 'Normal'
  END as prioridad_cobro,

  -- Monto de riesgo
  CASE
    WHEN CURRENT_DATE - e.fecha::date > 60 THEN true
    ELSE false
  END as alto_riesgo

FROM clientes c
INNER JOIN eventos e ON c.id = e.cliente_id
LEFT JOIN djs d ON e.dj_id = d.id
WHERE e.cobrado_cliente = false
ORDER BY dias_pendiente DESC, monto_pendiente DESC;

-- =====================================================
-- 3. Vista: Rendimiento Mensual por Cliente
-- =====================================================
CREATE OR REPLACE VIEW vw_cliente_rendimiento_mensual AS
SELECT
  c.id as cliente_id,
  c.nombre as cliente_nombre,
  EXTRACT(YEAR FROM e.fecha) as año,
  EXTRACT(MONTH FROM e.fecha) as mes,
  TO_CHAR(e.fecha, 'YYYY-MM') as mes_año,

  -- Métricas del mes
  COUNT(e.id) as total_eventos,
  SUM(e.cache_total) as facturacion_mes,
  SUM(e.parte_agencia) as comision_mes,
  AVG(e.cache_total) as precio_medio_evento,

  -- Estado de cobros
  SUM(CASE WHEN e.cobrado_cliente = true THEN e.cache_total ELSE 0 END) as cobrado_mes,
  SUM(CASE WHEN e.cobrado_cliente = false THEN e.cache_total ELSE 0 END) as pendiente_mes,

  -- DJs contratados ese mes
  COUNT(DISTINCT e.dj_id) as djs_contratados

FROM clientes c
INNER JOIN eventos e ON c.id = e.cliente_id
GROUP BY c.id, c.nombre, EXTRACT(YEAR FROM e.fecha), EXTRACT(MONTH FROM e.fecha), TO_CHAR(e.fecha, 'YYYY-MM')
ORDER BY c.id, EXTRACT(YEAR FROM e.fecha) DESC, EXTRACT(MONTH FROM e.fecha) DESC;

-- =====================================================
-- 4. Vista: Top Clientes por Rentabilidad
-- =====================================================
CREATE OR REPLACE VIEW vw_top_clientes_rentabilidad AS
SELECT
  c.id as cliente_id,
  c.nombre as cliente_nombre,
  c.email as cliente_email,
  c.ciudad as cliente_ciudad,
  COUNT(e.id) as total_eventos,
  SUM(e.cache_total) as facturacion_total,
  SUM(e.parte_agencia) as comision_total,

  -- Promedio por evento
  CASE WHEN COUNT(e.id) > 0 THEN ROUND((SUM(e.cache_total) / COUNT(e.id))::numeric, 2) ELSE 0 END as promedio_evento,

  -- Actividad reciente
  COUNT(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '1 month' THEN 1 END) as eventos_ultimo_mes,
  COUNT(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '3 months' THEN 1 END) as eventos_ultimo_trimestre,

  -- Último evento
  MAX(e.fecha) as ultimo_evento

FROM clientes c
INNER JOIN eventos e ON c.id = e.cliente_id
GROUP BY c.id, c.nombre, c.email, c.ciudad
HAVING COUNT(e.id) > 0
ORDER BY comision_total DESC;

-- =====================================================
-- 5. Vista: Comparativa de Clientes (Mes Actual vs Anterior)
-- =====================================================
CREATE OR REPLACE VIEW vw_clientes_comparativa_rendimiento AS
SELECT
  c.id as cliente_id,
  c.nombre as cliente_nombre,
  c.ciudad as cliente_ciudad,

  -- Datos totales
  COUNT(e.id) as total_eventos,

  -- Mes actual
  COUNT(CASE
    WHEN e.fecha >= DATE_TRUNC('month', CURRENT_DATE)
    THEN 1
  END) as eventos_mes_actual,

  SUM(CASE
    WHEN e.fecha >= DATE_TRUNC('month', CURRENT_DATE)
    THEN e.cache_total
    ELSE 0
  END) as facturacion_mes_actual,

  -- Mes anterior
  COUNT(CASE
    WHEN e.fecha >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND e.fecha < DATE_TRUNC('month', CURRENT_DATE)
    THEN 1
  END) as eventos_mes_anterior,

  SUM(CASE
    WHEN e.fecha >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND e.fecha < DATE_TRUNC('month', CURRENT_DATE)
    THEN e.cache_total
    ELSE 0
  END) as facturacion_mes_anterior,

  -- Promedio por evento
  CASE WHEN COUNT(e.id) > 0 THEN ROUND((SUM(e.cache_total) / COUNT(e.id))::numeric, 2) ELSE 0 END as promedio_por_evento

FROM clientes c
LEFT JOIN eventos e ON c.id = e.cliente_id
WHERE c.activo = true
GROUP BY c.id, c.nombre, c.ciudad
HAVING COUNT(e.id) > 0
ORDER BY eventos_mes_actual DESC;

-- =====================================================
-- 6. Función: Resumen de Cobros Pendientes por Cliente
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_resumen_cobros_pendientes_clientes()
RETURNS TABLE (
  prioridad TEXT,
  total_clientes BIGINT,
  total_eventos BIGINT,
  monto_total NUMERIC,
  comision_total NUMERIC,
  dias_promedio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN CURRENT_DATE - e.fecha::date > 60 THEN 'Crítica'
      WHEN CURRENT_DATE - e.fecha::date > 30 THEN 'Urgente'
      WHEN CURRENT_DATE - e.fecha::date > 15 THEN 'Alta'
      ELSE 'Normal'
    END as prioridad,
    COUNT(DISTINCT c.id) as total_clientes,
    COUNT(e.id) as total_eventos,
    ROUND(SUM(e.cache_total)::numeric, 2) as monto_total,
    ROUND(SUM(e.parte_agencia)::numeric, 2) as comision_total,
    ROUND(AVG(CURRENT_DATE - e.fecha::date)::numeric, 1) as dias_promedio
  FROM clientes c
  INNER JOIN eventos e ON c.id = e.cliente_id
  WHERE e.cobrado_cliente = false
  GROUP BY prioridad
  ORDER BY
    CASE prioridad
      WHEN 'Crítica' THEN 1
      WHEN 'Urgente' THEN 2
      WHEN 'Alta' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Vista: Análisis de Fidelidad de Clientes
-- =====================================================
CREATE OR REPLACE VIEW vw_clientes_fidelidad AS
SELECT
  c.id as cliente_id,
  c.nombre as cliente_nombre,
  c.ciudad as cliente_ciudad,

  -- Métricas de fidelidad
  COUNT(e.id) as total_eventos,
  MIN(e.fecha) as primer_evento,
  MAX(e.fecha) as ultimo_evento,

  -- Tiempo como cliente (en meses)
  CASE
    WHEN MIN(e.fecha) IS NOT NULL THEN
      ROUND((CURRENT_DATE - MIN(e.fecha)::date) / 30.0, 1)
    ELSE 0
  END as meses_como_cliente,

  -- Tasa de eventos por mes
  CASE
    WHEN MIN(e.fecha) IS NOT NULL AND MIN(e.fecha) != MAX(e.fecha) THEN
      ROUND(
        (COUNT(e.id)::numeric / GREATEST(1, (MAX(e.fecha)::date - MIN(e.fecha)::date) / 30.0))::numeric,
        2
      )
    WHEN COUNT(e.id) = 1 THEN 1
    ELSE 0
  END as eventos_por_mes,

  -- Valor total
  SUM(e.cache_total) as valor_total_cliente,
  SUM(e.parte_agencia) as rentabilidad_total,

  -- Nivel de fidelidad
  CASE
    WHEN COUNT(e.id) >= 20 AND
         (CURRENT_DATE - MIN(e.fecha)::date) >= 365
    THEN 'Cliente Platino'
    WHEN COUNT(e.id) >= 10 AND
         (CURRENT_DATE - MIN(e.fecha)::date) >= 180
    THEN 'Cliente Oro'
    WHEN COUNT(e.id) >= 5
    THEN 'Cliente Plata'
    WHEN COUNT(e.id) >= 2
    THEN 'Cliente Bronce'
    ELSE 'Cliente Nuevo'
  END as nivel_fidelidad,

  -- Riesgo de pérdida
  CASE
    WHEN MAX(e.fecha) < CURRENT_DATE - INTERVAL '6 months' THEN 'Alto'
    WHEN MAX(e.fecha) < CURRENT_DATE - INTERVAL '3 months' THEN 'Medio'
    ELSE 'Bajo'
  END as riesgo_perdida

FROM clientes c
LEFT JOIN eventos e ON c.id = e.cliente_id
WHERE c.activo = true
GROUP BY c.id, c.nombre, c.ciudad
HAVING COUNT(e.id) > 0
ORDER BY valor_total_cliente DESC;

-- =====================================================
-- Índices para optimización
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_eventos_cliente_fecha ON eventos(cliente_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_cobrado_cliente ON eventos(cobrado_cliente) WHERE cobrado_cliente = false;

-- =====================================================
-- Comentarios en las vistas
-- =====================================================
COMMENT ON VIEW vw_cliente_financial_stats IS 'Estadísticas financieras completas de cada cliente';
COMMENT ON VIEW vw_clientes_cobros_pendientes IS 'Listado de cobros pendientes por cliente con prioridad';
COMMENT ON VIEW vw_cliente_rendimiento_mensual IS 'Rendimiento mensual detallado por cliente';
COMMENT ON VIEW vw_top_clientes_rentabilidad IS 'Ranking de clientes por rentabilidad para la agencia';
COMMENT ON VIEW vw_clientes_comparativa_rendimiento IS 'Comparativa mes actual vs mes anterior por cliente';
COMMENT ON VIEW vw_clientes_fidelidad IS 'Análisis de fidelidad y riesgo de pérdida de clientes';
COMMENT ON FUNCTION obtener_resumen_cobros_pendientes_clientes IS 'Resumen agrupado de cobros pendientes por prioridad';

-- =====================================================
-- Fin de migración 008
-- =====================================================
