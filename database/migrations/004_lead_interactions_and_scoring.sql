-- Migración: Sistema de Interacciones, Lead Scoring y Features Avanzadas de CRM
-- Fecha: 2025-01-26

-- ============================================
-- TABLA: lead_interactions
-- Timeline completo de interacciones con leads
-- ============================================
CREATE TABLE IF NOT EXISTS lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'llamada', 'email', 'reunion', 'nota', 'estado_cambio', 'whatsapp'
  descripcion TEXT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_proxima_accion TIMESTAMP,
  recordatorio BOOLEAN DEFAULT false,
  completado BOOLEAN DEFAULT false,
  fecha_completado TIMESTAMP,
  metadatos JSONB DEFAULT '{}'::jsonb, -- Datos adicionales (ej: duración llamada, asunto email, etc.)

  CONSTRAINT valid_tipo CHECK (tipo IN (
    'llamada', 'email', 'reunion', 'nota',
    'estado_cambio', 'whatsapp', 'sms', 'otro'
  ))
);

CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_tipo ON lead_interactions(tipo);
CREATE INDEX idx_lead_interactions_fecha ON lead_interactions(fecha_creacion DESC);
CREATE INDEX idx_lead_interactions_recordatorio ON lead_interactions(recordatorio, fecha_proxima_accion)
  WHERE recordatorio = true AND completado = false;

-- ============================================
-- AGREGAR CAMPOS DE LEAD SCORING A TABLA LEADS
-- ============================================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS puntuacion INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS probabilidad_conversion DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS ultima_interaccion TIMESTAMP,
  ADD COLUMN IF NOT EXISTS num_interacciones INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias_sin_contacto INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS origen_detalle VARCHAR(255), -- Detalles de la fuente (ej: "Google Ads - Campaña Bodas")
  ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Índices para lead scoring y analytics
CREATE INDEX IF NOT EXISTS idx_leads_puntuacion ON leads(puntuacion DESC);
CREATE INDEX IF NOT EXISTS idx_leads_probabilidad ON leads(probabilidad_conversion DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ultima_interaccion ON leads(ultima_interaccion DESC);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON leads(fuente);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);

-- ============================================
-- FUNCIÓN: Calcular puntuación de lead automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION calcular_puntuacion_lead(p_lead_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_puntuacion INTEGER := 0;
  v_num_interacciones INTEGER;
  v_dias_desde_creacion INTEGER;
  v_tiene_email BOOLEAN;
  v_tiene_telefono BOOLEAN;
  v_tiene_presupuesto BOOLEAN;
  v_tiene_fecha_evento BOOLEAN;
BEGIN
  -- Obtener datos del lead
  SELECT
    (email IS NOT NULL AND email != '') INTO v_tiene_email
  FROM leads WHERE id = p_lead_id;

  SELECT
    (telefono IS NOT NULL AND telefono != '') INTO v_tiene_telefono
  FROM leads WHERE id = p_lead_id;

  SELECT
    (presupuesto_estimado IS NOT NULL AND presupuesto_estimado > 0) INTO v_tiene_presupuesto
  FROM leads WHERE id = p_lead_id;

  SELECT
    (fecha_evento IS NOT NULL) INTO v_tiene_fecha_evento
  FROM leads WHERE id = p_lead_id;

  SELECT
    EXTRACT(DAY FROM (NOW() - fecha_creacion))::INTEGER INTO v_dias_desde_creacion
  FROM leads WHERE id = p_lead_id;

  SELECT COUNT(*) INTO v_num_interacciones
  FROM lead_interactions WHERE lead_id = p_lead_id;

  -- Calcular puntuación

  -- +20 puntos si tiene email
  IF v_tiene_email THEN
    v_puntuacion := v_puntuacion + 20;
  END IF;

  -- +15 puntos si tiene teléfono
  IF v_tiene_telefono THEN
    v_puntuacion := v_puntuacion + 15;
  END IF;

  -- +25 puntos si tiene presupuesto estimado
  IF v_tiene_presupuesto THEN
    v_puntuacion := v_puntuacion + 25;
  END IF;

  -- +20 puntos si tiene fecha de evento
  IF v_tiene_fecha_evento THEN
    v_puntuacion := v_puntuacion + 20;
  END IF;

  -- +5 puntos por cada interacción (máx 50)
  v_puntuacion := v_puntuacion + LEAST(v_num_interacciones * 5, 50);

  -- -2 puntos por cada día sin contacto (hasta -30)
  IF v_dias_desde_creacion > 7 THEN
    v_puntuacion := v_puntuacion - LEAST((v_dias_desde_creacion - 7) * 2, 30);
  END IF;

  -- Asegurar que la puntuación esté entre 0 y 100
  v_puntuacion := GREATEST(0, LEAST(100, v_puntuacion));

  -- Actualizar la puntuación en la tabla
  UPDATE leads
  SET puntuacion = v_puntuacion,
      probabilidad_conversion = CASE
        WHEN v_puntuacion >= 80 THEN 90.00
        WHEN v_puntuacion >= 60 THEN 70.00
        WHEN v_puntuacion >= 40 THEN 50.00
        WHEN v_puntuacion >= 20 THEN 30.00
        ELSE 10.00
      END
  WHERE id = p_lead_id;

  RETURN v_puntuacion;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Actualizar puntuación al crear interacción
-- ============================================
CREATE OR REPLACE FUNCTION trigger_actualizar_puntuacion_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar última interacción y contador
  UPDATE leads
  SET
    ultima_interaccion = NEW.fecha_creacion,
    num_interacciones = num_interacciones + 1,
    dias_sin_contacto = 0
  WHERE id = NEW.lead_id;

  -- Recalcular puntuación
  PERFORM calcular_puntuacion_lead(NEW.lead_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_interaction_score
  AFTER INSERT ON lead_interactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_puntuacion_lead();

-- ============================================
-- FUNCIÓN: Actualizar días sin contacto (ejecutar diariamente)
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_dias_sin_contacto()
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET dias_sin_contacto = EXTRACT(DAY FROM (NOW() - COALESCE(ultima_interaccion, fecha_creacion)))::INTEGER
  WHERE activo = true AND estado NOT IN ('ganado', 'perdido');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLA: lead_notifications (log de notificaciones enviadas)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_notifications (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'email', 'slack', 'sms', 'webhook'
  destinatario VARCHAR(255),
  asunto VARCHAR(255),
  contenido TEXT,
  estado VARCHAR(50) DEFAULT 'enviado', -- 'pendiente', 'enviado', 'error'
  error_mensaje TEXT,
  fecha_envio TIMESTAMP DEFAULT NOW(),
  metadatos JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_lead_notifications_lead_id ON lead_notifications(lead_id);
CREATE INDEX idx_lead_notifications_tipo ON lead_notifications(tipo);
CREATE INDEX idx_lead_notifications_estado ON lead_notifications(estado);

-- ============================================
-- INSERTAR DATOS DE EJEMPLO
-- ============================================

-- Calcular puntuación para todos los leads existentes
DO $$
DECLARE
  v_lead RECORD;
BEGIN
  FOR v_lead IN SELECT id FROM leads WHERE activo = true
  LOOP
    PERFORM calcular_puntuacion_lead(v_lead.id);
  END LOOP;
END;
$$;

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE lead_interactions IS 'Timeline completo de interacciones con leads (llamadas, emails, reuniones, notas)';
COMMENT ON TABLE lead_notifications IS 'Log de todas las notificaciones enviadas relacionadas con leads';
COMMENT ON COLUMN leads.puntuacion IS 'Puntuación del lead (0-100) calculada automáticamente';
COMMENT ON COLUMN leads.probabilidad_conversion IS 'Probabilidad estimada de conversión (%)';
COMMENT ON FUNCTION calcular_puntuacion_lead IS 'Calcula la puntuación de un lead basándose en múltiples factores';
