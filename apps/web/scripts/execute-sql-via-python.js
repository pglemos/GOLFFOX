require('dotenv').config({ path: '.env.local' })
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

async function executeViaPython() {
  console.log('🐍 Tentando executar SQL via Python (psycopg2)...\n')

  const migrationPath = path.join(__dirname, '..', '..', 'database', 'migrations', 'fix_companies_updated_at_final.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Arquivo SQL não encontrado:', migrationPath)
    return false
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  // Criar script Python temporário
  const pythonScript = `
import os
import sys
from pathlib import Path

# Adicionar path do projeto
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    import psycopg2
    from dotenv import load_dotenv
    
    load_dotenv(project_root / 'web-app' / '.env.local')
    
    # Obter credenciais do Supabase
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
    if not supabase_url:
        print('❌ NEXT_PUBLIC_SUPABASE_URL não configurado')
        sys.exit(1)
    
    # Extrair host do URL
    # Exemplo: https://xxxxx.supabase.co -> db.xxxxx.supabase.co
    host = supabase_url.replace('https://', '').replace('.supabase.co', '')
    db_host = f'db.{host}.supabase.co'
    
    # Tentar obter senha do service role (não temos acesso direto)
    # Vamos tentar usar a connection string se disponível
    db_password = os.getenv('SUPABASE_DB_PASSWORD') or os.getenv('PGPASSWORD')
    
    if not db_password:
        print('⚠️ Senha do banco não encontrada nas variáveis de ambiente')
        print('💡 Tentando usar service role key para autenticação...')
        # Não podemos usar service role key para conexão direta
        sys.exit(1)
    
    # Conectar ao banco
    conn = psycopg2.connect(
        host=db_host,
        port=5432,
        database='postgres',
        user='postgres',
        password=db_password
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    # Executar SQL
    sql = """${sql.replace(/`/g, '\\`').replace(/\$/g, '\\$')}"""
    cur.execute(sql)
    
    print('✅ SQL executado com sucesso!')
    cur.close()
    conn.close()
    sys.exit(0)
    
except ImportError:
    print('❌ psycopg2 não instalado. Execute: pip install psycopg2-binary')
    sys.exit(1)
except Exception as e:
    print(f'❌ Erro: {e}')
    sys.exit(1)
`

  const pythonScriptPath = path.join(__dirname, 'temp_fix_sql.py')
  
  try {
    fs.writeFileSync(pythonScriptPath, pythonScript)
    console.log('📝 Script Python criado')
    
    // Tentar executar
    try {
      execSync(`python "${pythonScriptPath}"`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..')
      })
      console.log('✅ SQL executado via Python!')
      fs.unlinkSync(pythonScriptPath)
      return true
    } catch (err) {
      console.log('⚠️ Python não disponível ou erro na execução')
      fs.unlinkSync(pythonScriptPath)
      return false
    }
  } catch (err) {
    console.error('❌ Erro ao criar script Python:', err.message)
    if (fs.existsSync(pythonScriptPath)) {
      fs.unlinkSync(pythonScriptPath)
    }
    return false
  }
}

executeViaPython()
  .then(success => {
    if (success) {
      console.log('\n✅ Correção aplicada!')
      process.exit(0)
    } else {
      console.log('\n⚠️ Não foi possível executar via Python')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('❌ Erro:', err)
    process.exit(1)
  })

