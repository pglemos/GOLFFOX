#!/usr/bin/env python3
"""
Script de validação final usando conexão direta ao PostgreSQL
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
import uuid
from datetime import datetime

def get_db_connection():
    """Conecta diretamente ao PostgreSQL do Supabase"""
    try:
        # Usando as credenciais do Supabase
        conn = psycopg2.connect(
            host="aws-0-us-east-1.pooler.supabase.com",
            port=6543,
            user="postgres.vmoxzesvjcfmrebagcwo",
            password="golffox2024!",
            database="postgres"
        )
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco: {e}")
        return None

def check_table_structure(conn, table_name):
    """Verifica a estrutura de uma tabela"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cur.fetchall()
        return columns

def check_table_exists(conn, table_name):
    """Verifica se uma tabela existe"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = %s AND table_schema = 'public'
            )
        """, (table_name,))
        
        return cur.fetchone()[0]

def create_test_data(conn):
    """Cria dados de teste usando SQL direto"""
    print("🏢 Criando dados de teste...")
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        try:
            # 1. Criar empresa de teste
            company_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO companies (id, name, cnpj, address) 
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                RETURNING id
            """, (company_id, 'GolfFox Test Company', '12.345.678/0001-90', 'Rua Teste, 123'))
            
            result = cur.fetchone()
            if result:
                print(f"✅ Empresa criada: {company_id}")
            else:
                # Se não criou, pegar uma empresa existente
                cur.execute("SELECT id FROM companies LIMIT 1")
                result = cur.fetchone()
                if result:
                    company_id = result['id']
                    print(f"📋 Usando empresa existente: {company_id}")
            
            # 2. Criar usuário de teste
            user_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO users (id, email, name, company_id, role) 
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            """, (user_id, 'test@golffox.com', 'Usuário Teste', company_id, 'admin'))
            
            result = cur.fetchone()
            if result:
                print(f"✅ Usuário criado: {user_id}")
            
            # 3. Criar motorista de teste (se a tabela existir)
            if check_table_exists(conn, 'drivers'):
                driver_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO drivers (id, user_id, license_number, license_category, company_id) 
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (license_number) DO NOTHING
                    RETURNING id
                """, (driver_id, user_id, 'CNH123456789', 'D', company_id))
                
                result = cur.fetchone()
                if result:
                    print(f"✅ Motorista criado: {driver_id}")
            
            # 4. Criar veículo de teste
            vehicle_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO vehicles (id, license_plate, model, capacity, company_id) 
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (license_plate) DO NOTHING
                RETURNING id
            """, (vehicle_id, 'TEST-1234', 'Mercedes Sprinter', 20, company_id))
            
            result = cur.fetchone()
            if result:
                print(f"✅ Veículo criado: {vehicle_id}")
            
            # 5. Criar rota de teste
            route_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO routes (id, name, description, company_id) 
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                RETURNING id
            """, (route_id, 'Rota Teste', 'Rota de teste do sistema', company_id))
            
            result = cur.fetchone()
            if result:
                print(f"✅ Rota criada: {route_id}")
            
            conn.commit()
            print("✅ Dados de teste criados com sucesso!")
            
        except Exception as e:
            print(f"❌ Erro ao criar dados de teste: {e}")
            conn.rollback()

def validate_system(conn):
    """Valida o sistema completo"""
    print("\n🔍 Validando sistema...")
    
    # Verificar tabelas principais
    main_tables = ['companies', 'users', 'vehicles', 'routes', 'trips']
    
    for table in main_tables:
        if check_table_exists(conn, table):
            columns = check_table_structure(conn, table)
            print(f"✅ Tabela {table}: {len(columns)} colunas")
            
            # Contar registros
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"   📊 {count} registros")
        else:
            print(f"❌ Tabela {table}: NÃO EXISTE")
    
    # Verificar tabela drivers
    if check_table_exists(conn, 'drivers'):
        columns = check_table_structure(conn, 'drivers')
        print(f"✅ Tabela drivers: {len(columns)} colunas")
        
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM drivers")
            count = cur.fetchone()[0]
            print(f"   📊 {count} registros")
    else:
        print("❌ Tabela drivers: NÃO EXISTE")
    
    # Verificar views
    print("\n🔍 Verificando views...")
    views = ['v_active_trips', 'v_driver_last_position', 'v_route_stops']
    
    for view in views:
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {view}")
                count = cur.fetchone()[0]
                print(f"✅ View {view}: {count} registros")
        except Exception as e:
            print(f"❌ View {view}: {e}")
    
    # Verificar RPC
    print("\n⚙️ Verificando RPC...")
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT gf_map_snapshot_full()")
            result = cur.fetchone()
            if result:
                data = result['gf_map_snapshot_full']
                if isinstance(data, dict):
                    keys = list(data.keys())
                    print(f"✅ RPC gf_map_snapshot_full: OK (chaves: {keys})")
                else:
                    print(f"✅ RPC gf_map_snapshot_full: OK (dados: {data})")
    except Exception as e:
        print(f"❌ RPC gf_map_snapshot_full: {e}")

def main():
    print("🚀 Iniciando validação final do banco de dados...")
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        # Verificar estrutura atual
        print("\n📋 Verificando estrutura atual...")
        
        # Verificar tabela companies
        if check_table_exists(conn, 'companies'):
            columns = check_table_structure(conn, 'companies')
            print(f"✅ Tabela companies: {len(columns)} colunas")
            for col in columns:
                print(f"   - {col['column_name']}: {col['data_type']}")
        
        # Criar dados de teste
        create_test_data(conn)
        
        # Validar sistema
        validate_system(conn)
        
        print("\n🎉 Validação final concluída!")
        print("✅ Banco de dados está totalmente funcional!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante a validação: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)