-- ============================================================================
-- Migration V025: Campos de Pairing para Vinculación de Dispositivos POS
-- ============================================================================
-- Fecha: 13 Octubre 2025
-- Descripción: Añade campos para el sistema de pairing/vinculación de dispositivos
--              mediante tokens temporales y códigos de emparejamiento
-- ============================================================================

-- Añadir campos de pairing
ALTER TABLE dispositivos_pos
ADD COLUMN IF NOT EXISTS pairing_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS pairing_token_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10);

-- Índices para mejorar búsquedas por código/token
CREATE INDEX IF NOT EXISTS idx_dispositivos_pos_pairing_code
ON dispositivos_pos(pairing_code)
WHERE pairing_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dispositivos_pos_pairing_token
ON dispositivos_pos(pairing_token)
WHERE pairing_token IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN dispositivos_pos.pairing_token IS 'Token JWT temporal para vincular el dispositivo (expira en 1 hora)';
COMMENT ON COLUMN dispositivos_pos.pairing_token_expires_at IS 'Fecha de expiración del token de pairing';
COMMENT ON COLUMN dispositivos_pos.pairing_code IS 'Código corto de 6-10 caracteres para emparejamiento manual (ej: 842-931)';

-- ============================================================================
-- CÓMO FUNCIONA EL SISTEMA DE PAIRING:
-- ============================================================================
/*
PASO 1: GENERACIÓN (Admin desde backoffice)
- Admin genera token de pairing para un dispositivo: GET /api/dispositivos-pos/{id}/qr
- Se genera: token JWT (1h validez) + código corto + QR
- Se almacena: pairing_token, pairing_token_expires_at, pairing_code

PASO 2: VINCULACIÓN (Dispositivo físico)
Opción A: Escaneo QR
- Dispositivo escanea QR → Llama a GET /api/dispositivos-pos/setup?p={token}
- Backend valida token y retorna deviceToken (30 días)

Opción B: Código manual
- Empleado ingresa código manualmente → Llama a GET /api/dispositivos-pos/pair?code={codigo}
- Backend valida código y retorna deviceToken (30 días)

PASO 3: USO
- Dispositivo usa deviceToken para todas las operaciones
- Token se renueva automáticamente si es necesario
*/

-- ============================================================================
-- FIN DE MIGRATION V025
-- ============================================================================
