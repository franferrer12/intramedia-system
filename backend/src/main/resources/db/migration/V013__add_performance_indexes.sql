-- Migration V013: Add performance indexes for common queries
-- Date: 2025-10-10
-- Purpose: Improve query performance by adding strategic indexes

-- Index on transacciones for date range queries (P&L reports, analytics)
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones(categoria_id);

-- Index on eventos for date queries and status
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);

-- Index on empleados for active status queries
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);
CREATE INDEX IF NOT EXISTS idx_empleados_rol ON empleados(rol);

-- Index on jornadas_trabajo for date and employee queries
CREATE INDEX IF NOT EXISTS idx_jornadas_fecha ON jornadas_trabajo(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_jornadas_empleado ON jornadas_trabajo(empleado_id);
CREATE INDEX IF NOT EXISTS idx_jornadas_pagada ON jornadas_trabajo(pagada);
CREATE INDEX IF NOT EXISTS idx_jornadas_nomina ON jornadas_trabajo(nomina_id);

-- Index on nominas for date queries
CREATE INDEX IF NOT EXISTS idx_nominas_mes ON nominas(mes);
CREATE INDEX IF NOT EXISTS idx_nominas_anio ON nominas(anio);
CREATE INDEX IF NOT EXISTS idx_nominas_empleado ON nominas(empleado_id);

-- Index on movimientos_stock for inventory tracking
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_stock(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_stock(tipo_movimiento);

-- Index on inventario for quick stock lookups
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario(producto_id);

-- Index on alertas_stock for active alerts
CREATE INDEX IF NOT EXISTS idx_alertas_resuelta ON alertas_stock(resuelta);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas_stock(fecha_creacion DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha_tipo ON transacciones(fecha DESC, tipo);
CREATE INDEX IF NOT EXISTS idx_jornadas_empleado_fecha ON jornadas_trabajo(empleado_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_fecha ON movimientos_stock(producto_id, fecha DESC);
