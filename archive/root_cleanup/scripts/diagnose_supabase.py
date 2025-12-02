import psycopg2
import json

# Conectar ao Supabase
conn_string = "postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()
    
    print("✅ Conectado ao Supabase com sucesso!\n")
    
    # 1. Verificar tabelas relacionadas a company
    print("=" * 60)
    print("1. VERIFICANDO TABELAS DE EMPRESAS")
    print("=" * 60)
    
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name LIKE '%compan%'
        ORDER BY table_name;
    """)
    
    tables = cur.fetchall()
    print(f"\nTabelas encontradas: {len(tables)}")
    for table in tables:
        print(f"  - {table[0]}")
    
    # 2. Se companies existir, verificar colunas
    if any('companies' in str(t) for t in tables):
        print("\n" + "=" * 60)
        print("2. SCHEMA DA TABELA 'companies'")
        print("=" * 60)
        
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'companies'
            ORDER BY ordinal_position;
        """)
        
        columns = cur.fetchall()
        print(f"\nColunas da tabela 'companies': {len(columns)}")
        for col in columns:
            nullable = "NULL" if col[2] == 'YES' else "NOT NULL"
            print(f"  - {col[0]:30} {col[1]:20} {nullable}")
    
    # 3. Verificar tabelas de usuários
    print("\n" + "=" * 60)
    print("3. VERIFICANDO TABELAS DE USUÁRIOS")
    print("=" * 60)
    
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name LIKE '%user%'
        ORDER BY table_name;
    """)
    
    user_tables = cur.fetchall()
    print(f"\nTabelas de usuários encontradas: {len(user_tables)}")
    for table in user_tables:
        print(f"  - {table[0]}")
    
    # 4. Verificar se usuários de teste existem
    print("\n" + "=" * 60)
    print("4. VERIFICANDO USUÁRIOS DE TESTE")
    print("=" * 60)
    
    # Tentar em 'users'
    try:
        cur.execute("""
            SELECT id, email, role 
            FROM users 
            WHERE email IN ('teste@transportadora.com', 'teste@empresa.com', 'golffox@admin.com')
            ORDER BY email;
        """)
        
        test_users = cur.fetchall()
        if test_users:
            print(f"\nUsuários encontrados na tabela 'users': {len(test_users)}")
            for user in test_users:
                print(f"  - {user[1]:30} Role: {user[2]}")
        else:
            print("\n⚠️  Nenhum usuário de teste encontrado na tabela 'users'")
    except Exception as e:
        print(f"\n⚠️  Tabela 'users' não encontrada ou erro: {e}")
    
    # 5. Contar empresas existentes
    if any('companies' in str(t) for t in tables):
        print("\n" + "=" * 60)
        print("5. EMPRESAS EXISTENTES")
        print("=" * 60)
        
        cur.execute("SELECT COUNT(*) FROM companies;")
        count = cur.fetchone()[0]
        print(f"\nTotal de empresas: {count}")
        
        if count > 0:
            cur.execute("""
                SELECT id, name, cnpj, is_active 
                FROM companies 
                LIMIT 5;
            """)
            companies = cur.fetchall()
            print("\nPrimeiras 5 empresas:")
            for comp in companies:
                active = "✅ Ativa" if comp[3] else "❌ Inativa"
                print(f"  - {comp[1]:40} CNPJ: {comp[2] or 'N/A':20} {active}")
    
    # 6. Verificar políticas RLS
    print("\n" + "=" * 60)
    print("6. POLÍTICAS RLS (Row Level Security)")
    print("=" * 60)
    
    cur.execute("""
        SELECT schemaname, tablename, policyname, permissive, roles, cmd
        FROM pg_policies 
        WHERE tablename LIKE '%compan%'
        ORDER BY tablename, policyname;
    """)
    
    policies = cur.fetchall()
    if policies:
        print(f"\nPolíticas RLS encontradas: {len(policies)}")
        for policy in policies:
            print(f"\nTabela: {policy[1]}")
            print(f"  Política: {policy[2]}")
            print(f"  Tipo: {policy[3]}")
            print(f"  Roles: {policy[4]}")
            print(f"  Comando: {policy[5]}")
    else:
        print("\n✅ Nenhuma política RLS encontrada (ou RLS desabilitado)")
    
    print("\n" + "=" * 60)
    print("✅ DIAGNÓSTICO COMPLETO!")
    print("=" * 60)
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Erro ao conectar/consultar banco: {e}")
    import traceback
    traceback.print_exc()
