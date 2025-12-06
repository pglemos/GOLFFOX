-- ====================================================
-- GolfFox Migration Control System
-- Tabela para rastrear migrations aplicadas
-- ====================================================
-- Esta migration cria a tabela de controle de versão
-- Deve ser executada primeiro antes de qualquer outra migration

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);

-- Comentários para documentação
COMMENT ON TABLE schema_migrations IS 'Controla quais migrations foram aplicadas ao banco de dados';
COMMENT ON COLUMN schema_migrations.version IS 'Versão da migration (timestamp ou número sequencial)';
COMMENT ON COLUMN schema_migrations.name IS 'Nome do arquivo da migration';
COMMENT ON COLUMN schema_migrations.applied_at IS 'Data/hora em que a migration foi aplicada';

