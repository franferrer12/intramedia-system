-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📋 SISTEMA DE CONTRATOS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Descripción: Sistema completo de gestión de contratos con plantillas,
--              versionado, firma digital y generación de PDF
-- Fecha: 2025-11-10
-- Versión: 1.0
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Tipos ENUM para contratos
CREATE TYPE contract_status AS ENUM (
  'draft',           -- Borrador
  'pending_review',  -- Pendiente de revisión
  'pending_signature', -- Pendiente de firma
  'signed',          -- Firmado
  'active',          -- Activo
  'expired',         -- Vencido
  'cancelled',       -- Cancelado
  'terminated'       -- Terminado
);

CREATE TYPE contract_type AS ENUM (
  'service',         -- Servicio general
  'dj_service',      -- Servicio DJ
  'client_agreement', -- Acuerdo con cliente
  'partnership',     -- Socio/Partnership
  'venue',           -- Local/Venue
  'supplier',        -- Proveedor
  'confidentiality', -- Confidencialidad/NDA
  'other'            -- Otro
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: contract_templates (Plantillas de contratos)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE contract_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contract_type contract_type NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL, -- Contenido con placeholders {{variable}}
  variables JSONB, -- Lista de variables disponibles
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Plantilla por defecto para este tipo
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: contracts (Contratos)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(50) UNIQUE NOT NULL, -- CON-2025-0001
  contract_type contract_type NOT NULL,
  status contract_status DEFAULT 'draft',

  -- Referencias
  template_id INTEGER REFERENCES contract_templates(id),
  cliente_id INTEGER REFERENCES clientes(id),
  dj_id INTEGER REFERENCES djs(id),
  evento_id INTEGER REFERENCES eventos(id),

  -- Partes del contrato
  party_a_name VARCHAR(255) NOT NULL, -- Nombre parte A (Agencia)
  party_a_id VARCHAR(100), -- NIF/CIF parte A
  party_a_address TEXT,

  party_b_name VARCHAR(255) NOT NULL, -- Nombre parte B (Cliente/DJ)
  party_b_id VARCHAR(100), -- NIF/CIF parte B
  party_b_address TEXT,
  party_b_email VARCHAR(255),
  party_b_phone VARCHAR(50),

  -- Contenido y datos
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- Contenido final del contrato
  variables JSONB, -- Variables usadas para generar el contrato

  -- Términos comerciales
  total_amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_terms TEXT,

  -- Fechas
  start_date DATE,
  end_date DATE,
  signature_date DATE,
  expiration_date DATE,

  -- Firma digital
  signed_by_party_a BOOLEAN DEFAULT false,
  signed_by_party_b BOOLEAN DEFAULT false,
  signature_party_a_data JSONB, -- Datos de firma (IP, timestamp, etc)
  signature_party_b_data JSONB,
  signature_method VARCHAR(50), -- 'digital', 'scanned', 'electronic'

  -- Archivos
  pdf_url VARCHAR(500), -- URL del PDF generado
  signed_pdf_url VARCHAR(500), -- URL del PDF firmado
  attachments JSONB, -- Array de archivos adjuntos

  -- Versionado
  version INTEGER DEFAULT 1,
  parent_contract_id INTEGER REFERENCES contracts(id), -- Si es una versión nueva

  -- Renovación automática
  auto_renew BOOLEAN DEFAULT false,
  renewal_period VARCHAR(50), -- 'monthly', 'quarterly', 'yearly'
  renewal_notice_days INTEGER DEFAULT 30,

  -- Alertas y notificaciones
  expiration_alert_sent BOOLEAN DEFAULT false,
  renewal_alert_sent BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  internal_notes TEXT, -- Notas internas no visibles en PDF
  tags VARCHAR(255)[],

  -- Auditoría
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  cancelled_by INTEGER REFERENCES users(id),
  cancellation_reason TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: contract_history (Historial de cambios)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE contract_history (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'signed', 'cancelled', etc
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by INTEGER REFERENCES users(id),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÍNDICES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Contratos
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_contracts_cliente ON contracts(cliente_id);
CREATE INDEX idx_contracts_dj ON contracts(dj_id);
CREATE INDEX idx_contracts_evento ON contracts(evento_id);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
CREATE INDEX idx_contracts_expiration ON contracts(expiration_date) WHERE status = 'active';
CREATE INDEX idx_contracts_deleted ON contracts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_renewal ON contracts(auto_renew, expiration_date) WHERE auto_renew = true AND status = 'active';

-- Plantillas
CREATE INDEX idx_templates_type ON contract_templates(contract_type);
CREATE INDEX idx_templates_active ON contract_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_templates_default ON contract_templates(contract_type, is_default) WHERE is_default = true;

-- Historial
CREATE INDEX idx_history_contract ON contract_history(contract_id, created_at DESC);
CREATE INDEX idx_history_user ON contract_history(changed_by);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Actualizar updated_at automáticamente
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generar número de contrato automáticamente
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := 'CON-' ||
                          TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
                          LPAD(NEXTVAL('contracts_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_contract_number_trigger
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_number();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DATOS INICIALES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Plantilla básica de contrato de servicio DJ
INSERT INTO contract_templates (name, contract_type, description, template_content, variables, is_default)
VALUES (
  'Contrato Estándar de Servicio DJ',
  'dj_service',
  'Plantilla estándar para contratos con DJs',
  'CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

Entre las partes:

PARTE A (EL CLIENTE):
Nombre: {{party_a_name}}
NIF/CIF: {{party_a_id}}
Domicilio: {{party_a_address}}

PARTE B (EL DJ):
Nombre: {{party_b_name}}
NIF/CIF: {{party_b_id}}
Domicilio: {{party_b_address}}

CLÁUSULAS:

PRIMERA: OBJETO DEL CONTRATO
El DJ se compromete a prestar sus servicios profesionales en el evento "{{event_name}}" que tendrá lugar el día {{event_date}} en {{event_location}}.

SEGUNDA: DURACIÓN
La actuación tendrá una duración aproximada de {{event_hours}} horas, desde las {{start_time}} hasta las {{end_time}}.

TERCERA: CONTRAPRESTACIÓN ECONÓMICA
El cliente abonará al DJ la cantidad de {{total_amount}} {{currency}}, según las condiciones de pago establecidas: {{payment_terms}}.

CUARTA: OBLIGACIONES DEL DJ
- Presentarse con la antelación acordada
- Aportar equipo profesional de sonido
- Respetar el horario establecido

QUINTA: OBLIGACIONES DEL CLIENTE
- Facilitar acceso y espacio adecuado
- Realizar el pago en tiempo y forma
- Informar de requisitos técnicos específicos

SEXTA: RESOLUCIÓN
Este contrato podrá rescindirse por mutuo acuerdo o por incumplimiento de cualquiera de las partes.

En prueba de conformidad, firman el presente contrato en {{signature_city}}, a {{signature_date}}.

Por la PARTE A:                    Por la PARTE B:
{{party_a_signature}}              {{party_b_signature}}',
  '{
    "party_a_name": "Nombre del cliente",
    "party_a_id": "NIF/CIF del cliente",
    "party_a_address": "Dirección del cliente",
    "party_b_name": "Nombre del DJ",
    "party_b_id": "NIF/CIF del DJ",
    "party_b_address": "Dirección del DJ",
    "event_name": "Nombre del evento",
    "event_date": "Fecha del evento",
    "event_location": "Ubicación del evento",
    "event_hours": "Horas de actuación",
    "start_time": "Hora de inicio",
    "end_time": "Hora de fin",
    "total_amount": "Importe total",
    "currency": "Moneda",
    "payment_terms": "Condiciones de pago",
    "signature_city": "Ciudad de firma",
    "signature_date": "Fecha de firma"
  }',
  true
);

-- Comentarios
COMMENT ON TABLE contracts IS 'Contratos del sistema con firma digital y versionado';
COMMENT ON TABLE contract_templates IS 'Plantillas reutilizables para contratos';
COMMENT ON TABLE contract_history IS 'Historial completo de cambios en contratos';
COMMENT ON COLUMN contracts.contract_number IS 'Número único del contrato (CON-YYYY-NNNN)';
COMMENT ON COLUMN contracts.auto_renew IS 'Renovación automática al vencer';
COMMENT ON COLUMN contracts.version IS 'Versión del contrato (para versionado)';
