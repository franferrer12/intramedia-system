-- ============================================================================
-- ESTANDARIZACIÓN COMPLETA DE BASE DE DATOS A INGLÉS
-- Fecha: 2025-12-03
-- Propósito: Resolver duplicaciones y estandarizar nomenclatura
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: ELIMINAR TABLA DUPLICADA 'usuarios' (código usa 'users')
-- ============================================================================

-- Verificar foreign keys que apuntan a usuarios (deberían apuntar a users)
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    FOR fk_record IN
        SELECT
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'usuarios'
    LOOP
        RAISE NOTICE 'FK encontrada: %.% (columna: %) -> usuarios',
            fk_record.table_name, fk_record.constraint_name, fk_record.column_name;

        -- Actualizar FK para apuntar a users en lugar de usuarios
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I',
            fk_record.table_name, fk_record.constraint_name);

        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES users(id)',
            fk_record.table_name, fk_record.constraint_name, fk_record.column_name);
    END LOOP;
END $$;

-- Eliminar tabla usuarios (solo 1 registro, código no la usa)
DROP TABLE IF EXISTS usuarios CASCADE;

RAISE NOTICE '✓ Tabla usuarios eliminada';

-- ============================================================================
-- PASO 2: RENOMBRAR SISTEMA DE COTIZACIONES (español → inglés)
-- ============================================================================

-- Renombrar tabla cotizaciones
ALTER TABLE IF EXISTS cotizaciones RENAME TO quotations;
ALTER TABLE IF EXISTS cotizacion_items RENAME TO quotation_items;

-- Renombrar sequences
ALTER SEQUENCE IF EXISTS cotizaciones_id_seq RENAME TO quotations_id_seq;
ALTER SEQUENCE IF EXISTS cotizacion_items_id_seq RENAME TO quotation_items_id_seq;

-- Renombrar constraints en quotations
DO $$
DECLARE
    constraint_record RECORD;
    new_name TEXT;
BEGIN
    FOR constraint_record IN
        SELECT conname as constraint_name
        FROM pg_constraint
        WHERE conrelid = 'quotations'::regclass
            AND conname LIKE '%cotizacion%'
    LOOP
        new_name := REPLACE(constraint_record.constraint_name, 'cotizacion', 'quotation');
        EXECUTE format('ALTER TABLE quotations RENAME CONSTRAINT %I TO %I',
            constraint_record.constraint_name, new_name);
    END LOOP;
END $$;

-- Renombrar constraints en quotation_items
DO $$
DECLARE
    constraint_record RECORD;
    new_name TEXT;
BEGIN
    FOR constraint_record IN
        SELECT conname as constraint_name
        FROM pg_constraint
        WHERE conrelid = 'quotation_items'::regclass
            AND conname LIKE '%cotizacion%'
    LOOP
        new_name := REPLACE(constraint_record.constraint_name, 'cotizacion', 'quotation');
        EXECUTE format('ALTER TABLE quotation_items RENAME CONSTRAINT %I TO %I',
            constraint_record.constraint_name, new_name);
    END LOOP;
END $$;

RAISE NOTICE '✓ Sistema de cotizaciones renombrado a quotations';

-- ============================================================================
-- PASO 3: RENOMBRAR CLIENTES → CLIENTS
-- ============================================================================

ALTER TABLE IF EXISTS clientes RENAME TO clients;

-- Renombrar sequence
ALTER SEQUENCE IF EXISTS clientes_id_seq RENAME TO clients_id_seq;

-- Renombrar constraints y foreign keys que referencian 'clientes'
DO $$
DECLARE
    constraint_record RECORD;
    new_name TEXT;
BEGIN
    -- Renombrar constraints en la tabla clients
    FOR constraint_record IN
        SELECT conname as constraint_name
        FROM pg_constraint
        WHERE conrelid = 'clients'::regclass
            AND conname LIKE '%cliente%'
    LOOP
        new_name := REPLACE(constraint_record.constraint_name, 'cliente', 'client');
        EXECUTE format('ALTER TABLE clients RENAME CONSTRAINT %I TO %I',
            constraint_record.constraint_name, new_name);
    END LOOP;

    -- Actualizar FKs en otras tablas que apuntan a clients
    FOR constraint_record IN
        SELECT
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'clients'
            AND tc.constraint_name LIKE '%cliente%'
    LOOP
        new_name := REPLACE(constraint_record.constraint_name, 'cliente', 'client');
        EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
            constraint_record.table_name, constraint_record.constraint_name, new_name);
    END LOOP;
END $$;

RAISE NOTICE '✓ Tabla clientes renombrada a clients';

-- ============================================================================
-- PASO 4: RENOMBRAR EVENTOS → EVENTS
-- ============================================================================

ALTER TABLE IF EXISTS eventos RENAME TO events;

-- Renombrar sequence
ALTER SEQUENCE IF EXISTS eventos_id_seq RENAME TO events_id_seq;

-- Renombrar constraints
DO $$
DECLARE
    constraint_record RECORD;
    new_name TEXT;
BEGIN
    -- Renombrar constraints en la tabla events
    FOR constraint_record IN
        SELECT conname as constraint_name
        FROM pg_constraint
        WHERE conrelid = 'events'::regclass
            AND conname LIKE '%evento%'
    LOOP
        new_name := REPLACE(constraint_record.constraint_name, 'evento', 'event');
        EXECUTE format('ALTER TABLE events RENAME CONSTRAINT %I TO %I',
            constraint_record.constraint_name, new_name);
    END LOOP;

    -- Actualizar FKs en otras tablas que apuntan a events
    FOR constraint_record IN
        SELECT
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'events'
            AND tc.constraint_name LIKE '%evento%'
    LOOP
        new_name := REPLACE(constraint_record.constraint_name, 'evento', 'event');
        EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
            constraint_record.table_name, constraint_record.constraint_name, new_name);
    END LOOP;
END $$;

RAISE NOTICE '✓ Tabla eventos renombrada a events';

-- ============================================================================
-- PASO 5: RENOMBRAR OTRAS TABLAS MENORES EN ESPAÑOL
-- ============================================================================

-- categorias_evento → event_categories
ALTER TABLE IF EXISTS categorias_evento RENAME TO event_categories;
ALTER SEQUENCE IF EXISTS categorias_evento_id_seq RENAME TO event_categories_id_seq;

-- pagos_clientes → client_payments
ALTER TABLE IF EXISTS pagos_clientes RENAME TO client_payments;
ALTER SEQUENCE IF EXISTS pagos_clientes_id_seq RENAME TO client_payments_id_seq;

-- pagos_djs → dj_payments
ALTER TABLE IF EXISTS pagos_djs RENAME TO dj_payments;
ALTER SEQUENCE IF EXISTS pagos_djs_id_seq RENAME TO dj_payments_id_seq;

-- socios → partners
ALTER TABLE IF EXISTS socios RENAME TO partners;
ALTER SEQUENCE IF EXISTS socios_id_seq RENAME TO partners_id_seq;

-- notificaciones → notifications
ALTER TABLE IF EXISTS notificaciones RENAME TO notifications;
ALTER SEQUENCE IF EXISTS notificaciones_id_seq RENAME TO notifications_id_seq;

-- configuracion_agencia → agency_configuration
ALTER TABLE IF EXISTS configuracion_agencia RENAME TO agency_configuration;
ALTER SEQUENCE IF EXISTS configuracion_agencia_id_seq RENAME TO agency_configuration_id_seq;

RAISE NOTICE '✓ Tablas menores renombradas';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    spanish_tables TEXT[];
BEGIN
    SELECT ARRAY_AGG(table_name)
    INTO spanish_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND (
            table_name LIKE '%cliente%'
            OR table_name LIKE '%evento%'
            OR table_name LIKE '%cotizacion%'
            OR table_name LIKE '%socio%'
            OR table_name = 'usuarios'
        );

    IF spanish_tables IS NOT NULL THEN
        RAISE WARNING 'Todavía existen tablas con nombres en español: %', spanish_tables;
    ELSE
        RAISE NOTICE '✓ TODAS las tablas estandarizadas a inglés';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
--
-- ELIMINADAS:
--   - usuarios (duplicado de users)
--
-- RENOMBRADAS:
--   - cotizaciones → quotations
--   - cotizacion_items → quotation_items
--   - clientes → clients
--   - eventos → events
--   - categorias_evento → event_categories
--   - pagos_clientes → client_payments
--   - pagos_djs → dj_payments
--   - socios → partners
--   - notificaciones → notifications
--   - configuracion_agencia → agency_configuration
--
-- TOTAL: 1 eliminada + 10 renombradas
-- ============================================================================
