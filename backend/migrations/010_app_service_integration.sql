-- ============================================
-- MIGRATION 010: App Service Integration
-- ============================================
-- Agrega campos y tablas necesarias para la integración con la app móvil (app-service)
-- Fecha: 2025-01-24
-- Autor: Intra Media System Team
-- ============================================

BEGIN;

-- ==========================================
-- 1. AGREGAR CAMPOS A TABLA DJS
-- ==========================================
-- Campos para disponibilidad y nombre artístico (usado por app móvil)

DO $$
BEGIN
  -- Campo availability (calendario de disponibilidad)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'availability'
  ) THEN
    ALTER TABLE djs ADD COLUMN availability JSONB;
    RAISE NOTICE 'Campo availability agregado a tabla djs';
  ELSE
    RAISE NOTICE 'Campo availability ya existe en tabla djs';
  END IF;

  -- Campo artistic_name (nombre artístico)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'artistic_name'
  ) THEN
    ALTER TABLE djs ADD COLUMN artistic_name VARCHAR(255);
    RAISE NOTICE 'Campo artistic_name agregado a tabla djs';
  ELSE
    RAISE NOTICE 'Campo artistic_name ya existe en tabla djs';
  END IF;

  -- Campo location (ubicación del DJ)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'location'
  ) THEN
    ALTER TABLE djs ADD COLUMN location VARCHAR(255);
    RAISE NOTICE 'Campo location agregado a tabla djs';
  ELSE
    RAISE NOTICE 'Campo location ya existe en tabla djs';
  END IF;
END$$;

-- Comentarios de documentación
COMMENT ON COLUMN djs.availability IS 'Calendario de disponibilidad del DJ en formato JSON: {days: [1,3,5], month: 1, year: 2025}. Usado por app móvil.';
COMMENT ON COLUMN djs.artistic_name IS 'Nombre artístico del DJ (puede diferir del nombre real)';
COMMENT ON COLUMN djs.location IS 'Ubicación/ciudad del DJ';

-- ==========================================
-- 2. AGREGAR CAMPOS A TABLA EVENTOS
-- ==========================================
-- Campos para horarios precisos (usado por app móvil)

DO $$
BEGIN
  -- Campo hora_inicio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'hora_inicio'
  ) THEN
    ALTER TABLE eventos ADD COLUMN hora_inicio TIME;
    RAISE NOTICE 'Campo hora_inicio agregado a tabla eventos';
  ELSE
    RAISE NOTICE 'Campo hora_inicio ya existe en tabla eventos';
  END IF;

  -- Campo hora_fin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eventos' AND column_name = 'hora_fin'
  ) THEN
    ALTER TABLE eventos ADD COLUMN hora_fin TIME;
    RAISE NOTICE 'Campo hora_fin agregado a tabla eventos';
  ELSE
    RAISE NOTICE 'Campo hora_fin ya existe en tabla eventos';
  END IF;
END$$;

-- Comentarios de documentación
COMMENT ON COLUMN eventos.hora_inicio IS 'Hora de inicio precisa del evento (ej: 22:00:00)';
COMMENT ON COLUMN eventos.hora_fin IS 'Hora de finalización precisa del evento (ej: 03:00:00)';

-- ==========================================
-- 3. TRIGGER PARA CALCULAR HORAS AUTOMÁTICAMENTE
-- ==========================================
-- Calcula el campo 'horas' basándose en hora_inicio y hora_fin

CREATE OR REPLACE FUNCTION calculate_horas_from_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Si ambos campos están presentes, calcular horas
  IF NEW.hora_inicio IS NOT NULL AND NEW.hora_fin IS NOT NULL THEN
    -- Calcular diferencia en horas (puede cruzar medianoche)
    NEW.horas := EXTRACT(EPOCH FROM (NEW.hora_fin - NEW.hora_inicio)) / 3600.0;

    -- Si es negativo, el evento cruza medianoche, agregar 24 horas
    IF NEW.horas < 0 THEN
      NEW.horas := NEW.horas + 24;
    END IF;

    -- Recalcular euro_hora_dj si parte_dj está definido
    IF NEW.parte_dj IS NOT NULL AND NEW.horas > 0 THEN
      NEW.euro_hora_dj := NEW.parte_dj / NEW.horas;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'eventos_calculate_horas_trigger'
  ) THEN
    CREATE TRIGGER eventos_calculate_horas_trigger
    BEFORE INSERT OR UPDATE ON eventos
    FOR EACH ROW
    EXECUTE FUNCTION calculate_horas_from_times();
    RAISE NOTICE 'Trigger eventos_calculate_horas_trigger creado';
  ELSE
    RAISE NOTICE 'Trigger eventos_calculate_horas_trigger ya existe';
  END IF;
END$$;

COMMENT ON FUNCTION calculate_horas_from_times() IS 'Calcula automáticamente el campo horas basándose en hora_inicio y hora_fin. Maneja eventos que cruzan medianoche.';

-- ==========================================
-- 4. CREAR TABLA REQUESTS (Solicitudes de DJs)
-- ==========================================
-- Permite a DJs solicitar cambios en eventos desde la app móvil

CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  budget DECIMAL(10,2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_requests_dj_id ON requests(dj_id);
CREATE INDEX IF NOT EXISTS idx_requests_evento_id ON requests(evento_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

-- Comentarios de documentación
COMMENT ON TABLE requests IS 'Solicitudes creadas por DJs desde la app móvil (ej: cambios de horario, observaciones)';
COMMENT ON COLUMN requests.dj_id IS 'DJ que crea la solicitud';
COMMENT ON COLUMN requests.evento_id IS 'Evento relacionado (opcional)';
COMMENT ON COLUMN requests.status IS 'Estado: pending (nuevo), approved (aprobado), rejected (rechazado), in_progress (en proceso), completed (completado)';
COMMENT ON COLUMN requests.priority IS 'Prioridad: low, medium, high, urgent';
COMMENT ON COLUMN requests.budget IS 'Presupuesto estimado (opcional)';

-- ==========================================
-- 5. CREAR TABLA USER_DEVICES (Tokens de notificaciones)
-- ==========================================
-- Almacena tokens FCM para push notifications en app móvil

CREATE TABLE IF NOT EXISTS user_devices (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,

  fcm_token TEXT NOT NULL,
  device_type VARCHAR(20) CHECK (device_type IN ('ios', 'android', 'web')),
  device_name VARCHAR(255),

  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(dj_id, fcm_token)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_devices_dj_id ON user_devices(dj_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active ON user_devices(last_active DESC);

-- Comentarios de documentación
COMMENT ON TABLE user_devices IS 'Dispositivos registrados para recibir push notifications';
COMMENT ON COLUMN user_devices.fcm_token IS 'Token de Firebase Cloud Messaging';
COMMENT ON COLUMN user_devices.device_type IS 'Tipo de dispositivo: ios, android, web';
COMMENT ON COLUMN user_devices.last_active IS 'Última vez que el dispositivo estuvo activo (para limpiar tokens antiguos)';

-- ==========================================
-- 6. FUNCIÓN PARA LIMPIAR TOKENS ANTIGUOS
-- ==========================================
-- Elimina tokens de dispositivos inactivos por más de 90 días

CREATE OR REPLACE FUNCTION cleanup_inactive_devices()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_devices
  WHERE last_active < (CURRENT_TIMESTAMP - INTERVAL '90 days');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_inactive_devices() IS 'Elimina dispositivos inactivos por más de 90 días. Retorna el número de registros eliminados.';

-- ==========================================
-- 7. TRIGGER PARA UPDATED_AT EN REQUESTS
-- ==========================================

CREATE OR REPLACE FUNCTION update_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'requests_update_timestamp'
  ) THEN
    CREATE TRIGGER requests_update_timestamp
    BEFORE UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION update_requests_updated_at();
    RAISE NOTICE 'Trigger requests_update_timestamp creado';
  ELSE
    RAISE NOTICE 'Trigger requests_update_timestamp ya existe';
  END IF;
END$$;

COMMIT;

-- ==========================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'MIGRACIÓN 010 COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Campos agregados a tabla djs:';
  RAISE NOTICE '  - availability (JSONB)';
  RAISE NOTICE '  - artistic_name (VARCHAR)';
  RAISE NOTICE '  - location (VARCHAR)';
  RAISE NOTICE '';
  RAISE NOTICE 'Campos agregados a tabla eventos:';
  RAISE NOTICE '  - hora_inicio (TIME)';
  RAISE NOTICE '  - hora_fin (TIME)';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  - requests (solicitudes de DJs)';
  RAISE NOTICE '  - user_devices (tokens de notificaciones)';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers creados:';
  RAISE NOTICE '  - eventos_calculate_horas_trigger';
  RAISE NOTICE '  - requests_update_timestamp';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  - calculate_horas_from_times()';
  RAISE NOTICE '  - cleanup_inactive_devices()';
  RAISE NOTICE '  - update_requests_updated_at()';
  RAISE NOTICE '';
  RAISE NOTICE 'Sistema listo para integración con app móvil';
  RAISE NOTICE '================================================';
END$$;

-- Mostrar estadísticas
SELECT
  'djs' as tabla,
  COUNT(*) as total_registros,
  COUNT(availability) as con_availability,
  COUNT(artistic_name) as con_artistic_name
FROM djs;

SELECT
  'eventos' as tabla,
  COUNT(*) as total_registros,
  COUNT(hora_inicio) as con_hora_inicio,
  COUNT(hora_fin) as con_hora_fin
FROM eventos;

SELECT 'requests' as tabla, COUNT(*) as total_registros FROM requests;
SELECT 'user_devices' as tabla, COUNT(*) as total_registros FROM user_devices;
