-- Migración: Crear tabla de Leads para CRM básico
-- Fecha: 2025-10-25

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,

  -- Información de contacto
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  empresa VARCHAR(255),

  -- Información del evento potencial
  tipo_evento VARCHAR(100), -- Boda, Cumpleaños, Corporativo, etc.
  fecha_evento DATE,
  ciudad VARCHAR(100),
  presupuesto_estimado DECIMAL(10,2),
  num_invitados INTEGER,

  -- Estado del lead
  estado VARCHAR(50) DEFAULT 'nuevo',
  -- Estados: nuevo, contactado, propuesta, ganado, perdido

  -- Origen del lead
  fuente VARCHAR(100) DEFAULT 'web', -- web, redes, referido, telefono, otros

  -- Seguimiento
  notas TEXT,
  ultima_interaccion TIMESTAMP,
  proxima_accion VARCHAR(255),
  fecha_proxima_accion DATE,

  -- Conversión
  convertido_a_cliente BOOLEAN DEFAULT false,
  cliente_id INTEGER REFERENCES clientes(id),
  fecha_conversion TIMESTAMP,

  -- Metadata
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_fecha_creacion ON leads(fecha_creacion DESC);
CREATE INDEX idx_leads_cliente_id ON leads(cliente_id);
CREATE INDEX idx_leads_email ON leads(email);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_timestamp
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_leads_updated_at();

-- Comentarios
COMMENT ON TABLE leads IS 'Tabla de leads/prospectos para el CRM';
COMMENT ON COLUMN leads.estado IS 'Estados: nuevo, contactado, propuesta, ganado, perdido';
COMMENT ON COLUMN leads.fuente IS 'Origen del lead: web, redes, referido, telefono, otros';
