#!/usr/bin/env python3
"""
Script para verificar e corrigir políticas RLS (Row Level Security)
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

def get_db_connection():
    """Conecta ao banco de dados usando variáveis de ambiente"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('GF_DB_HOST'),
            port=os.getenv('GF_DB_PORT', 5432),
            user=os.getenv('GF_DB_USER'),
            password=os.getenv('GF_DB_PASSWORD'),
            database=os.getenv('GF_DB_NAME')
        )
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco: {e}")
        return None

def check_table_exists(conn, table_name):
    """Verifica se uma tabela existe"""
    query = """
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = %s
    );
    """
    
    with conn.cursor() as cur:
        cur.execute(query, (table_name,))
        return cur.fetchone()[0]

def get_all_tables(conn):
    """Lista todas as tabelas do esquema public"""
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
    """
    
    with conn.cursor() as cur:
        cur.execute(query)
        return [row[0] for row in cur.fetchall()]

def check_rls_status(conn, tables):
    """Verifica o status do RLS para todas as tabelas"""
    print("🔍 Verificando status do RLS...")
    
    rls_status = []
    
    for table in tables:
        query = """
        SELECT 
            schemaname,
            tablename,
            rowsecurity,
            hasrls
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = %s;
        """
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (table,))
                result = cur.fetchone()
                
                if result:
                    rls_status.append({
                        'table': table,
                        'rls_enabled': result['rowsecurity'],
                        'has_rls': result['hasrls']
                    })
                    
                    status = "✅ Habilitado" if result['rowsecurity'] else "❌ Desabilitado"
                    print(f"   {table}: {status}")
                    
        except Exception as e:
            print(f"❌ Erro ao verificar RLS para {table}: {e}")
    
    return rls_status

def get_existing_policies(conn, tables):
    """Lista todas as políticas RLS existentes"""
    print("\n🔍 Verificando políticas RLS existentes...")
    
    policies = []
    
    for table in tables:
        query = """
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = %s
        ORDER BY policyname;
        """
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (table,))
                table_policies = cur.fetchall()
                
                for policy in table_policies:
                    policies.append(dict(policy))
                    print(f"   {table}.{policy['policyname']}: {policy['cmd']}")
                    
                if not table_policies:
                    print(f"   {table}: Nenhuma política encontrada")
                    
        except Exception as e:
            print(f"❌ Erro ao verificar políticas para {table}: {e}")
    
    return policies

def check_helper_functions(conn):
    """Verifica se as funções auxiliares para RLS existem"""
    print("\n🔍 Verificando funções auxiliares para RLS...")
    
    helper_functions = [
        'is_admin',
        'current_company_id',
        'current_user_role',
        'can_access_company_data'
    ]
    
    existing_functions = []
    missing_functions = []
    
    for func in helper_functions:
        query = """
        SELECT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = %s
        );
        """
        
        try:
            with conn.cursor() as cur:
                cur.execute(query, (func,))
                exists = cur.fetchone()[0]
                
                if exists:
                    existing_functions.append(func)
                    print(f"   ✅ {func}()")
                else:
                    missing_functions.append(func)
                    print(f"   ❌ {func}() - AUSENTE")
                    
        except Exception as e:
            print(f"❌ Erro ao verificar função {func}: {e}")
    
    return existing_functions, missing_functions

def generate_rls_fixes(rls_status, missing_functions, tables):
    """Gera SQL para corrigir problemas de RLS"""
    sql_statements = []
    
    # Cabeçalho
    sql_statements.append("-- =====================================================")
    sql_statements.append("-- CORREÇÃO DE POLÍTICAS RLS")
    sql_statements.append("-- =====================================================")
    sql_statements.append("")
    
    # Criar funções auxiliares ausentes
    if missing_functions:
        sql_statements.append("-- 1. CRIAR FUNÇÕES AUXILIARES AUSENTES")
        sql_statements.append("")
        
        if 'is_admin' in missing_functions:
            sql_statements.extend([
                "-- Função para verificar se o usuário é admin",
                "CREATE OR REPLACE FUNCTION public.is_admin()",
                "RETURNS BOOLEAN AS $$",
                "BEGIN",
                "    -- Verifica se o usuário atual tem role de admin",
                "    RETURN EXISTS (",
                "        SELECT 1 FROM public.users u",
                "        WHERE u.id = auth.uid()",
                "        AND u.role IN ('admin', 'super_admin')",
                "    );",
                "END;",
                "$$ LANGUAGE plpgsql SECURITY DEFINER;",
                ""
            ])
        
        if 'current_company_id' in missing_functions:
            sql_statements.extend([
                "-- Função para obter company_id do usuário atual",
                "CREATE OR REPLACE FUNCTION public.current_company_id()",
                "RETURNS UUID AS $$",
                "BEGIN",
                "    RETURN (",
                "        SELECT u.company_id FROM public.users u",
                "        WHERE u.id = auth.uid()",
                "    );",
                "END;",
                "$$ LANGUAGE plpgsql SECURITY DEFINER;",
                ""
            ])
        
        if 'current_user_role' in missing_functions:
            sql_statements.extend([
                "-- Função para obter role do usuário atual",
                "CREATE OR REPLACE FUNCTION public.current_user_role()",
                "RETURNS TEXT AS $$",
                "BEGIN",
                "    RETURN (",
                "        SELECT u.role FROM public.users u",
                "        WHERE u.id = auth.uid()",
                "    );",
                "END;",
                "$$ LANGUAGE plpgsql SECURITY DEFINER;",
                ""
            ])
        
        if 'can_access_company_data' in missing_functions:
            sql_statements.extend([
                "-- Função para verificar acesso a dados da empresa",
                "CREATE OR REPLACE FUNCTION public.can_access_company_data(target_company_id UUID)",
                "RETURNS BOOLEAN AS $$",
                "BEGIN",
                "    -- Admin pode acessar tudo",
                "    IF public.is_admin() THEN",
                "        RETURN TRUE;",
                "    END IF;",
                "    ",
                "    -- Usuário pode acessar dados da própria empresa",
                "    RETURN target_company_id = public.current_company_id();",
                "END;",
                "$$ LANGUAGE plpgsql SECURITY DEFINER;",
                ""
            ])
    
    # Habilitar RLS em tabelas que não têm
    tables_without_rls = [item['table'] for item in rls_status if not item['rls_enabled']]
    
    if tables_without_rls:
        sql_statements.append("-- 2. HABILITAR RLS EM TABELAS")
        sql_statements.append("")
        
        for table in tables_without_rls:
            sql_statements.append(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")
        
        sql_statements.append("")
    
    # Criar políticas básicas para tabelas principais
    sql_statements.append("-- 3. CRIAR POLÍTICAS RLS BÁSICAS")
    sql_statements.append("")
    
    # Políticas para tabelas principais
    main_tables_policies = {
        'users': [
            "CREATE POLICY IF NOT EXISTS \"users_admin_all\" ON public.users FOR ALL USING (public.is_admin());",
            "CREATE POLICY IF NOT EXISTS \"users_self_read\" ON public.users FOR SELECT USING (id = auth.uid());",
            "CREATE POLICY IF NOT EXISTS \"users_self_update\" ON public.users FOR UPDATE USING (id = auth.uid());"
        ],
        'companies': [
            "CREATE POLICY IF NOT EXISTS \"companies_admin_all\" ON public.companies FOR ALL USING (public.is_admin());",
            "CREATE POLICY IF NOT EXISTS \"companies_members_read\" ON public.companies FOR SELECT USING (id = public.current_company_id());"
        ],
        'drivers': [
            "CREATE POLICY IF NOT EXISTS \"drivers_admin_all\" ON public.drivers FOR ALL USING (public.is_admin());",
            "CREATE POLICY IF NOT EXISTS \"drivers_company_read\" ON public.drivers FOR SELECT USING (company_id = public.current_company_id());",
            "CREATE POLICY IF NOT EXISTS \"drivers_self_read\" ON public.drivers FOR SELECT USING (user_id = auth.uid());"
        ],
        'vehicles': [
            "CREATE POLICY IF NOT EXISTS \"vehicles_admin_all\" ON public.vehicles FOR ALL USING (public.is_admin());",
            "CREATE POLICY IF NOT EXISTS \"vehicles_company_read\" ON public.vehicles FOR SELECT USING (company_id = public.current_company_id());"
        ],
        'routes': [
            "CREATE POLICY IF NOT EXISTS \"routes_admin_all\" ON public.routes FOR ALL USING (public.is_admin());",
            "CREATE POLICY IF NOT EXISTS \"routes_company_read\" ON public.routes FOR SELECT USING (company_id = public.current_company_id());",
            "CREATE POLICY IF NOT EXISTS \"routes_public_read\" ON public.routes FOR SELECT USING (is_active = true);"
        ],
        'trips': [
            "CREATE POLICY IF NOT EXISTS \"trips_admin_all\" ON public.trips FOR ALL USING (public.is_admin());",
            "CREATE POLICY IF NOT EXISTS \"trips_driver_read\" ON public.trips FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));",
            "CREATE POLICY IF NOT EXISTS \"trips_company_read\" ON public.trips FOR SELECT USING (route_id IN (SELECT id FROM public.routes WHERE company_id = public.current_company_id()));"
        ],
        'driver_positions': [
            "CREATE POLICY IF NOT EXISTS \"driver_positions_admin_all\" ON public.driver_positions FOR ALL USING (public.is_admin());",
            "CREATE POLICY IF NOT EXISTS \"driver_positions_driver_all\" ON public.driver_positions FOR ALL USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));",
            "CREATE POLICY IF NOT EXISTS \"driver_positions_company_read\" ON public.driver_positions FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE company_id = public.current_company_id()));"
        ]
    }
    
    for table, policies in main_tables_policies.items():
        if table in tables:
            sql_statements.append(f"-- Políticas para {table}")
            sql_statements.extend(policies)
            sql_statements.append("")
    
    # Políticas para tabelas GF_*
    gf_tables = [t for t in tables if t.startswith('gf_')]
    if gf_tables:
        sql_statements.append("-- 4. POLÍTICAS PARA TABELAS GF_*")
        sql_statements.append("")
        
        for table in gf_tables:
            sql_statements.extend([
                f"-- Políticas para {table}",
                f"CREATE POLICY IF NOT EXISTS \"{table}_admin_all\" ON public.{table} FOR ALL USING (public.is_admin());",
                f"CREATE POLICY IF NOT EXISTS \"{table}_company_read\" ON public.{table} FOR SELECT USING (public.can_access_company_data(company_id));",
                ""
            ])
    
    return "\n".join(sql_statements)

def main():
    print("🚀 Iniciando verificação de políticas RLS...")
    
    # Conectar ao banco
    conn = get_db_connection()
    if not conn:
        print("❌ Falha na conexão com o banco de dados")
        sys.exit(1)
    
    try:
        # Listar todas as tabelas
        tables = get_all_tables(conn)
        print(f"📊 Encontradas {len(tables)} tabelas")
        
        # Verificar status do RLS
        rls_status = check_rls_status(conn, tables)
        
        # Verificar políticas existentes
        existing_policies = get_existing_policies(conn, tables)
        
        # Verificar funções auxiliares
        existing_functions, missing_functions = check_helper_functions(conn)
        
        # Gerar relatório
        report = {
            'timestamp': datetime.now().isoformat(),
            'tables_count': len(tables),
            'tables': tables,
            'rls_status': rls_status,
            'existing_policies': existing_policies,
            'existing_functions': existing_functions,
            'missing_functions': missing_functions
        }
        
        # Salvar relatório
        report_file = 'tools/db/rls_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # Gerar SQL de correção
        fix_sql = generate_rls_fixes(rls_status, missing_functions, tables)
        
        fix_file = 'database/migrations/fix_rls_policies.sql'
        with open(fix_file, 'w', encoding='utf-8') as f:
            f.write(fix_sql)
        
        # Resumo
        tables_without_rls = len([item for item in rls_status if not item['rls_enabled']])
        
        print(f"\n📊 RESUMO:")
        print(f"   • Total de tabelas: {len(tables)}")
        print(f"   • Tabelas sem RLS: {tables_without_rls}")
        print(f"   • Políticas existentes: {len(existing_policies)}")
        print(f"   • Funções auxiliares existentes: {len(existing_functions)}")
        print(f"   • Funções auxiliares ausentes: {len(missing_functions)}")
        print(f"   • Relatório salvo: {report_file}")
        print(f"   • SQL de correção: {fix_file}")
        
        if missing_functions:
            print(f"\n⚠️  Funções auxiliares ausentes:")
            for func in missing_functions:
                print(f"   • {func}()")
        
        if tables_without_rls > 0:
            print(f"\n⚠️  Tabelas sem RLS:")
            for item in rls_status:
                if not item['rls_enabled']:
                    print(f"   • {item['table']}")
        
        # Código de saída baseado nos problemas encontrados
        exit_code = len(missing_functions) + tables_without_rls
        sys.exit(min(exit_code, 1))  # Máximo 1 para indicar problemas
        
    except Exception as e:
        print(f"❌ Erro durante a verificação: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()