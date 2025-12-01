-- =====================================================
-- Migration 016: Sistema de Pagos con Stripe
-- Sprint 5.1: Pagos Online
-- =====================================================
-- Descripción: Sistema completo de pagos con Stripe,
-- transacciones, métodos de pago, webhooks y refunds
-- =====================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ENUMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Estado de pago
CREATE TYPE payment_status AS ENUM (
  'pending',              -- Pendiente de pago
  'processing',           -- Procesando pago
  'requires_action',      -- Requiere acción del usuario (3D Secure)
  'succeeded',            -- Pago exitoso
  'failed',               -- Pago fallido
  'cancelled',            -- Pago cancelado
  'refunded',             -- Reembolsado
  'partially_refunded'    -- Reembolsado parcialmente
);

-- Tipo de pago
CREATE TYPE payment_type AS ENUM (
  'event_deposit',        -- Depósito de evento
  'event_balance',        -- Balance final de evento
  'event_full',           -- Pago completo de evento
  'subscription',         -- Suscripción
  'service',              -- Servicio adicional
  'late_fee',             -- Cargo por mora
  'other'                 -- Otro
);

-- Método de pago
CREATE TYPE payment_method_type AS ENUM (
  'card',                 -- Tarjeta de crédito/débito
  'bank_transfer',        -- Transferencia bancaria
  'cash',                 -- Efectivo
  'check',                -- Cheque
  'paypal',               -- PayPal
  'other'                 -- Otro
);

-- Estado de reembolso
CREATE TYPE refund_status AS ENUM (
  'pending',              -- Pendiente
  'processing',           -- Procesando
  'succeeded',            -- Exitoso
  'failed',               -- Fallido
  'cancelled'             -- Cancelado
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: payments
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE payments (
  -- Identificación
  id BIGSERIAL PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('payments_id_seq')::TEXT, 6, '0')),

  -- Referencias
  agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  evento_id BIGINT REFERENCES eventos(id) ON DELETE SET NULL,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  reservation_id BIGINT REFERENCES reservations(id) ON DELETE SET NULL,

  -- Stripe IDs
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_payment_method_id VARCHAR(255),

  -- Información del pago
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  amount_received DECIMAL(10, 2) DEFAULT 0 CHECK (amount_received >= 0),
  amount_refunded DECIMAL(10, 2) DEFAULT 0 CHECK (amount_refunded >= 0),

  -- Fees
  application_fee DECIMAL(10, 2) DEFAULT 0,
  stripe_fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount_received - application_fee - stripe_fee) STORED,

  -- Tipo y estado
  payment_type payment_type DEFAULT 'other' NOT NULL,
  payment_method payment_method_type DEFAULT 'card' NOT NULL,
  status payment_status DEFAULT 'pending' NOT NULL,

  -- Descripción
  description TEXT,
  statement_descriptor VARCHAR(22), -- Límite de Stripe

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Información de la tarjeta (si aplica)
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INT,
  card_exp_year INT,
  card_country VARCHAR(2),

  -- Información del cliente
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_phone VARCHAR(50),
  billing_address JSONB,

  -- Receipt
  receipt_url TEXT,
  receipt_email VARCHAR(255),

  -- Error handling
  failure_code VARCHAR(100),
  failure_message TEXT,

  -- Capture
  capture_method VARCHAR(50) DEFAULT 'automatic', -- automatic, manual
  captured_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_by BIGINT,
  updated_by BIGINT,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by BIGINT
);

-- Índices para payments
CREATE INDEX idx_payments_agency ON payments(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_evento ON payments(evento_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_cliente ON payments(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_reservation ON payments(reservation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_customer ON payments(stripe_customer_id);
CREATE INDEX idx_payments_status ON payments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_payment_type ON payments(payment_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_created_at ON payments(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC) WHERE deleted_at IS NULL AND paid_at IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: payment_methods
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE payment_methods (
  -- Identificación
  id BIGSERIAL PRIMARY KEY,

  -- Referencias
  agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE CASCADE,

  -- Stripe
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),

  -- Tipo
  type payment_method_type DEFAULT 'card' NOT NULL,

  -- Card info
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4) NOT NULL,
  card_exp_month INT,
  card_exp_year INT,
  card_country VARCHAR(2),
  card_fingerprint VARCHAR(255),

  -- Bank account info (si aplica)
  bank_name VARCHAR(255),
  bank_last4 VARCHAR(4),

  -- Billing details
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_phone VARCHAR(50),
  billing_address JSONB,

  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by BIGINT
);

-- Índices para payment_methods
CREATE INDEX idx_payment_methods_agency ON payment_methods(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_methods_cliente ON payment_methods(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default) WHERE deleted_at IS NULL AND is_default = TRUE;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: refunds
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE refunds (
  -- Identificación
  id BIGSERIAL PRIMARY KEY,
  refund_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('REF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('refunds_id_seq')::TEXT, 6, '0')),

  -- Referencias
  payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Stripe
  stripe_refund_id VARCHAR(255) UNIQUE,

  -- Montos
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,

  -- Fees refunded
  stripe_fee_refunded DECIMAL(10, 2) DEFAULT 0,

  -- Reason
  reason VARCHAR(50), -- duplicate, fraudulent, requested_by_customer
  reason_description TEXT,

  -- Status
  status refund_status DEFAULT 'pending' NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Failure
  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_by BIGINT NOT NULL,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by BIGINT
);

-- Índices para refunds
CREATE INDEX idx_refunds_payment ON refunds(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_refunds_agency ON refunds(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_refunds_stripe ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_status ON refunds(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC) WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: stripe_webhooks
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE stripe_webhooks (
  -- Identificación
  id BIGSERIAL PRIMARY KEY,

  -- Stripe event
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(255) NOT NULL,

  -- Payload
  payload JSONB NOT NULL,

  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_error TEXT,
  retry_count INT DEFAULT 0,

  -- Metadata
  api_version VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para stripe_webhooks
CREATE INDEX idx_webhooks_stripe_event ON stripe_webhooks(stripe_event_id);
CREATE INDEX idx_webhooks_event_type ON stripe_webhooks(event_type);
CREATE INDEX idx_webhooks_processed ON stripe_webhooks(processed, created_at DESC);
CREATE INDEX idx_webhooks_created_at ON stripe_webhooks(created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLA: payment_logs
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE payment_logs (
  -- Identificación
  id BIGSERIAL PRIMARY KEY,

  -- Referencias
  payment_id BIGINT REFERENCES payments(id) ON DELETE CASCADE,

  -- Log
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT,
  old_status payment_status,
  new_status payment_status,

  -- Data
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User
  created_by BIGINT
);

-- Índices para payment_logs
CREATE INDEX idx_payment_logs_payment ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger para updated_at en payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Trigger para updated_at en payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_payment_methods_updated_at();

-- Trigger para updated_at en refunds
CREATE OR REPLACE FUNCTION update_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refunds_updated_at
BEFORE UPDATE ON refunds
FOR EACH ROW
EXECUTE FUNCTION update_refunds_updated_at();

-- Trigger para logging de cambios de estado en payments
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO payment_logs (
      payment_id,
      event_type,
      event_description,
      old_status,
      new_status,
      created_by
    ) VALUES (
      NEW.id,
      'status_change',
      'Payment status changed from ' || OLD.status || ' to ' || NEW.status,
      OLD.status,
      NEW.status,
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_status_change_log
AFTER UPDATE ON payments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_payment_status_change();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VIEWS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vista completa de pagos con información relacionada
CREATE OR REPLACE VIEW payments_complete AS
SELECT
  p.*,
  a.agency_name,
  e.evento as event_name,
  e.fecha as event_date,
  c.nombre as cliente_name,
  c.email as cliente_email,
  r.reservation_number,
  COALESCE(
    (SELECT COUNT(*) FROM refunds rf WHERE rf.payment_id = p.id AND rf.deleted_at IS NULL),
    0
  ) as refund_count,
  COALESCE(
    (SELECT SUM(rf.amount) FROM refunds rf WHERE rf.payment_id = p.id AND rf.status = 'succeeded' AND rf.deleted_at IS NULL),
    0
  ) as total_refunded
FROM payments p
LEFT JOIN agencies a ON p.agency_id = a.id
LEFT JOIN eventos e ON p.evento_id = e.id
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN reservations r ON p.reservation_id = r.id
WHERE p.deleted_at IS NULL;

-- Vista de estadísticas de pagos por agencia
CREATE OR REPLACE VIEW payment_stats_by_agency AS
SELECT
  agency_id,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_payments,
  SUM(amount) as total_amount,
  SUM(amount_received) as total_received,
  SUM(amount_refunded) as total_refunded,
  SUM(net_amount) as total_net,
  AVG(amount) as avg_payment_amount,
  MIN(created_at) as first_payment_date,
  MAX(created_at) as last_payment_date
FROM payments
WHERE deleted_at IS NULL
GROUP BY agency_id;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIONES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Función para obtener balance de pagos de un evento
CREATE OR REPLACE FUNCTION get_event_payment_balance(p_evento_id BIGINT)
RETURNS TABLE (
  total_charged DECIMAL(10, 2),
  total_received DECIMAL(10, 2),
  total_refunded DECIMAL(10, 2),
  net_balance DECIMAL(10, 2),
  pending_amount DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(p.amount), 0) as total_charged,
    COALESCE(SUM(p.amount_received), 0) as total_received,
    COALESCE(SUM(p.amount_refunded), 0) as total_refunded,
    COALESCE(SUM(p.net_amount), 0) as net_balance,
    COALESCE(SUM(CASE WHEN p.status IN ('pending', 'processing', 'requires_action') THEN p.amount ELSE 0 END), 0) as pending_amount
  FROM payments p
  WHERE p.evento_id = p_evento_id
    AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular fees totales
CREATE OR REPLACE FUNCTION calculate_payment_fees(p_amount DECIMAL(10, 2), p_currency VARCHAR(3) DEFAULT 'EUR')
RETURNS TABLE (
  stripe_fee DECIMAL(10, 2),
  application_fee DECIMAL(10, 2),
  total_fees DECIMAL(10, 2),
  net_amount DECIMAL(10, 2)
) AS $$
DECLARE
  v_stripe_percentage DECIMAL(5, 4) := 0.029; -- 2.9%
  v_stripe_fixed DECIMAL(10, 2) := 0.30; -- $0.30
  v_application_percentage DECIMAL(5, 4) := 0.02; -- 2% application fee
BEGIN
  RETURN QUERY
  SELECT
    ROUND((p_amount * v_stripe_percentage + v_stripe_fixed)::NUMERIC, 2) as stripe_fee,
    ROUND((p_amount * v_application_percentage)::NUMERIC, 2) as application_fee,
    ROUND(((p_amount * v_stripe_percentage + v_stripe_fixed) + (p_amount * v_application_percentage))::NUMERIC, 2) as total_fees,
    ROUND((p_amount - ((p_amount * v_stripe_percentage + v_stripe_fixed) + (p_amount * v_application_percentage)))::NUMERIC, 2) as net_amount;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- COMENTARIOS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON TABLE payments IS 'Tabla principal de pagos con integración Stripe';
COMMENT ON TABLE payment_methods IS 'Métodos de pago guardados de clientes';
COMMENT ON TABLE refunds IS 'Reembolsos de pagos';
COMMENT ON TABLE stripe_webhooks IS 'Log de webhooks recibidos de Stripe';
COMMENT ON TABLE payment_logs IS 'Registro de cambios y eventos en pagos';

COMMENT ON VIEW payments_complete IS 'Vista completa de pagos con información relacionada';
COMMENT ON VIEW payment_stats_by_agency IS 'Estadísticas agregadas de pagos por agencia';

COMMENT ON FUNCTION get_event_payment_balance IS 'Obtener balance completo de pagos de un evento';
COMMENT ON FUNCTION calculate_payment_fees IS 'Calcular fees de Stripe y aplicación para un monto dado';
