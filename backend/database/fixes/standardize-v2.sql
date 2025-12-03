-- =======================================================================
-- ESTANDARIZACIÓN COMPLETA DE BASE DE DATOS A INGLÉS
-- Fecha: 2025-12-03
-- =======================================================================

BEGIN;

-- PASO 1: Eliminar tabla usuarios duplicada
DROP TABLE IF EXISTS usuarios CASCADE;

-- PASO 2: Renombrar sistema de cotizaciones
ALTER TABLE IF EXISTS cotizaciones RENAME TO quotations;
ALTER TABLE IF EXISTS cotizacion_items RENAME TO quotation_items;
ALTER SEQUENCE IF EXISTS cotizaciones_id_seq RENAME TO quotations_id_seq;
ALTER SEQUENCE IF EXISTS cotizacion_items_id_seq RENAME TO quotation_items_id_seq;

-- PASO 3: Renombrar clientes → clients
ALTER TABLE IF EXISTS clientes RENAME TO clients;
ALTER SEQUENCE IF EXISTS clientes_id_seq RENAME TO clients_id_seq;

-- PASO 4: Renombrar eventos → events
ALTER TABLE IF EXISTS eventos RENAME TO events;
ALTER SEQUENCE IF EXISTS eventos_id_seq RENAME TO events_id_seq;

-- PASO 5: Renombrar tablas menores
ALTER TABLE IF EXISTS categorias_evento RENAME TO event_categories;
ALTER SEQUENCE IF EXISTS categorias_evento_id_seq RENAME TO event_categories_id_seq;

ALTER TABLE IF EXISTS pagos_clientes RENAME TO client_payments;
ALTER SEQUENCE IF EXISTS pagos_clientes_id_seq RENAME TO client_payments_id_seq;

ALTER TABLE IF EXISTS pagos_djs RENAME TO dj_payments;
ALTER SEQUENCE IF EXISTS pagos_djs_id_seq RENAME TO dj_payments_id_seq;

ALTER TABLE IF EXISTS socios RENAME TO partners;
ALTER SEQUENCE IF EXISTS socios_id_seq RENAME TO partners_id_seq;

ALTER TABLE IF EXISTS notificaciones RENAME TO notifications;
ALTER SEQUENCE IF EXISTS notificaciones_id_seq RENAME TO notifications_id_seq;

ALTER TABLE IF EXISTS configuracion_agencia RENAME TO agency_configuration;
ALTER SEQUENCE IF EXISTS configuracion_agencia_id_seq RENAME TO agency_configuration_id_seq;

COMMIT;
