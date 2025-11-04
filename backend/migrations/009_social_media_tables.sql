-- Tabla para almacenar cuentas de redes sociales vinculadas
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- instagram, tiktok, youtube, spotify, soundcloud, facebook, twitter
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_type VARCHAR(50),
  expires_at TIMESTAMP,
  scope TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id, platform)
);

-- Tabla para guardar snapshots históricos de métricas
CREATE TABLE IF NOT EXISTS social_media_snapshots (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  followers INTEGER DEFAULT 0,
  engagement DECIMAL(5,2) DEFAULT 0,
  data JSONB, -- Guarda todos los datos en formato JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_social_accounts_dj ON social_media_accounts(dj_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_media_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_snapshots_dj_platform ON social_media_snapshots(dj_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_snapshots_created ON social_media_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_social_snapshots_data ON social_media_snapshots USING gin(data);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_social_media_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_social_media_accounts_updated_at
  BEFORE UPDATE ON social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_media_accounts_updated_at();

-- Comentarios
COMMENT ON TABLE social_media_accounts IS 'Cuentas de redes sociales vinculadas a DJs';
COMMENT ON TABLE social_media_snapshots IS 'Snapshots históricos de métricas de redes sociales';
COMMENT ON COLUMN social_media_accounts.access_token IS 'Token de acceso OAuth';
COMMENT ON COLUMN social_media_accounts.refresh_token IS 'Token de refresh OAuth';
COMMENT ON COLUMN social_media_snapshots.data IS 'Datos completos de la snapshot en formato JSON';
