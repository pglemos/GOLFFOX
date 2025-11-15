import os
import psycopg2
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env.local
load_dotenv(dotenv_path='F:/GOLFFOX/web-app/.env.local')

def get_db_connection():
    """Conecta diretamente ao PostgreSQL do Supabase usando variáveis de ambiente."""
    host = os.getenv('GF_DB_HOST', 'db.vmoxzesvjcfmrebagcwo.supabase.co')
    port = int(os.getenv('GF_DB_PORT', '5432'))
    user = os.getenv('GF_DB_USER', 'postgres')
    password = os.getenv('GF_DB_PASSWORD', 'Guigui1309@')
    dbname = os.getenv('GF_DB_NAME', 'postgres')

    print(f"📡 Conectando a: {host}:{port}/{dbname}")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname,
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco: {e}")
        return None

def execute_sql_fixes():
    """Executa as correções SQL no banco de dados."""
    conn = get_db_connection()
    if not conn:
        return False

    try:
        cur = conn.cursor()
        print("✅ Conectado ao banco de dados\n")

        sql_commands = """
-- Adicionar coluna is_active em routes
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar registros existentes em routes
UPDATE public.routes SET is_active = true WHERE is_active IS NULL;

-- Adicionar coluna is_active em users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar registros existentes em users
UPDATE public.users SET is_active = true WHERE is_active IS NULL;
        """
        
        print("📝 Executando correções SQL...")
        cur.execute(sql_commands)
        conn.commit()
        print("✅ SQL executado com sucesso!\n")

        # Verificar se as colunas foram adicionadas
        print("🔍 Verificando colunas adicionadas...")
        
        # Verificar routes.is_active
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'routes' AND column_name = 'is_active';
        """)
        if cur.fetchone():
            print("✅ Coluna routes.is_active existe!")
        else:
            print("❌ Coluna routes.is_active NÃO existe!")
            return False

        # Verificar users.is_active
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active';
        """)
        if cur.fetchone():
            print("✅ Coluna users.is_active existe!")
        else:
            print("❌ Coluna users.is_active NÃO existe!")
            return False

        return True
    except Exception as e:
        print(f"❌ Erro ao executar SQL: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print("🔧 Aplicando correções SQL no PostgreSQL...\n")
    if execute_sql_fixes():
        print("\n✅ Todas as correções aplicadas com sucesso!")
    else:
        print("\n❌ Falha ao aplicar as correções.")

