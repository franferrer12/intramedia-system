-- V008: Agregar relación de nómina a jornadas de trabajo
-- Fecha: 2025-01-06
-- Propósito: Vincular jornadas pagadas con las nóminas mensuales para análisis contable

-- Agregar columna nomina_id (opcional, para vincular jornadas incluidas en nómina mensual)
ALTER TABLE jornadas_trabajo
ADD COLUMN nomina_id BIGINT;

-- Agregar foreign key constraint
ALTER TABLE jornadas_trabajo
ADD CONSTRAINT fk_jornada_nomina FOREIGN KEY (nomina_id)
    REFERENCES nominas(id) ON DELETE SET NULL;

-- Crear índice para mejorar consultas por nómina
CREATE INDEX idx_jornadas_nomina_id ON jornadas_trabajo(nomina_id);

-- Comentario
COMMENT ON COLUMN jornadas_trabajo.nomina_id IS 'ID de la nómina mensual que incluye esta jornada (para control contable)';
