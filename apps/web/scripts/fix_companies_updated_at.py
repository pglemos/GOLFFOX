#!/usr/bin/env python3
"""
Script para executar correção SQL diretamente no PostgreSQL do Supabase
"""
import os
import sys
from pathlib import Path

try:
    import psycopg2
    from dotenv import load_dotenv
except ImportError as e:
    print(f'❌ Dependência não instalada: {e}')
    print('💡 Execute: pip install psycopg2-binary python-dotenv')
    sys.exit(1)

# Carregar variáveis de ambiente
project_root = Path(__file__).parent.parent.parent
env_file = project_root / 'web-app' / '.env.local'
if env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv()

# Obter credenciais do banco
# Tentar variáveis de ambiente primeiro, depois defaults do projeto
host = os.getenv('GF_DB_HOST') or os.getenv('PGHOST') or 'db.vmoxzesvjcfmrebagcwo.supabase.co'
port = int(os.getenv('GF_DB_PORT') or os.getenv('PGPORT') or '5432')
user = os.getenv('GF_DB_USER') or os.getenv('PGUSER') or 'postgres'
password = os.getenv('GF_DB_PASSWORD') or os.getenv('PGPASSWORD') or 'Guigui1309@'
dbname = os.getenv('GF_DB_NAME') or os.getenv('PGDATABASE') or 'postgres'

print('🔧 Executando correção SQL no PostgreSQL...\n')
print(f'📡 Conectando a: {host}:{port}/{dbname}')

try:
    # Conectar ao banco
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=dbname,
        sslmode='require'
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    print('✅ Conectado ao banco de dados\n')
    
    # SQL de correção
    sql = """
    -- 1. Adicionar coluna updated_at se não existir
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    
    -- 2. Atualizar valores existentes
    UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;
    
    -- 3. Corrigir função do trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Verificar se a coluna updated_at existe na tabela
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = TG_TABLE_SCHEMA 
        AND table_name = TG_TABLE_NAME 
        AND column_name = 'updated_at'
      ) THEN
        NEW.updated_at = NOW();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- 4. Recriar o trigger
    DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
    CREATE TRIGGER update_companies_updated_at 
      BEFORE UPDATE ON companies
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    """
    
    print('📝 Executando SQL...')
    cur.execute(sql)
    print('✅ SQL executado com sucesso!')
    
    # Verificar se funcionou
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'updated_at'
    """)
    
    if cur.fetchone():
        print('✅ Verificação: Coluna updated_at existe!')
    else:
        print('⚠️ Coluna updated_at não encontrada após execução')
    
    cur.close()
    conn.close()
    
    print('\n✅ Correção aplicada com sucesso!')
    sys.exit(0)
    
except psycopg2.OperationalError as e:
    print(f'❌ Erro de conexão: {e}')
    print('\n💡 Verifique as credenciais do banco de dados')
    sys.exit(1)
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

