#!/usr/bin/env python3
"""
Script para análise completa do esquema do banco de dados Supabase
Identifica tabelas ausentes, problemas de relacionamento, e inconsistências
"""
import os
import sys
from pathlib import Path
import psycopg2
import json

# Adicionar o diretório raiz ao path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "db"))

from run_migrations import connect_db

def get_all_tables(cursor):
    """Lista todas as tabelas no banco"""
    cursor.execute("""
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    return cursor.fetchall()

def get_all_views(cursor):
    """Lista todas as views no banco"""
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    return [row[0] for row in cursor.fetchall()]

def get_all_functions(cursor):
    """Lista todas as funções no banco"""
    cursor.execute("""
        SELECT routine_name, data_type, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        ORDER BY routine_name;
    """)
    return cursor.fetchall()

def check_table_columns(cursor, table_name):
    """Verifica as colunas de uma tabela específica"""
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    return cursor.fetchall()

def check_foreign_keys(cursor):
    """Lista todas as chaves estrangeiras"""
    cursor.execute("""
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
    """)
    return cursor.fetchall()

def check_rls_policies(cursor):
    """Lista todas as políticas RLS"""
    cursor.execute("""
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
    """)
    return cursor.fetchall()

def check_indexes(cursor):
    """Lista todos os índices"""
    cursor.execute("""
        SELECT
            t.relname AS table_name,
            i.relname AS index_name,
            ix.indisunique AS is_unique,
            ix.indisprimary AS is_primary,
            array_to_string(array_agg(a.attname), ', ') AS columns
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
        ORDER BY t.relname, i.relname;
    """)
    return cursor.fetchall()

def analyze_expected_tables():
    """Define as tabelas esperadas baseadas nos modelos Dart"""
    expected_tables = {
        # Tabelas principais do sistema
        'users': ['id', 'email', 'name', 'role', 'created_at', 'updated_at'],
        'companies': ['id', 'name', 'cnpj', 'address', 'created_at', 'updated_at'],
        'drivers': ['id', 'user_id', 'company_id', 'license_number', 'phone', 'created_at', 'updated_at'],
        'vehicles': ['id', 'company_id', 'plate', 'model', 'year', 'capacity', 'created_at', 'updated_at'],
        'routes': ['id', 'company_id', 'name', 'description', 'is_active', 'created_at', 'updated_at'],
        'bus_stops': ['id', 'route_id', 'name', 'latitude', 'longitude', 'order_index', 'created_at'],
        'trips': ['id', 'route_id', 'driver_id', 'vehicle_id', 'scheduled_at', 'started_at', 'completed_at', 'status'],
        'driver_positions': ['id', 'driver_id', 'lat', 'lng', 'accuracy', 'heading', 'speed', 'timestamp'],
        'trip_passengers': ['id', 'trip_id', 'passenger_id', 'bus_stop_id', 'boarded_at', 'status'],
        'trip_events': ['id', 'trip_id', 'event_type', 'data', 'timestamp'],
        
        # Tabelas auxiliares (gf_*)
        'gf_alerts': ['id', 'type', 'message', 'severity', 'created_at'],
        'gf_assistance_requests': ['id', 'driver_id', 'type', 'description', 'status', 'created_at'],
        'gf_driver_documents': ['id', 'driver_id', 'document_type', 'document_url', 'expires_at'],
        'gf_driver_events': ['id', 'driver_id', 'event_type', 'data', 'timestamp'],
        'gf_employee_company': ['id', 'user_id', 'company_id', 'role', 'created_at'],
        'gf_roles': ['id', 'name', 'permissions', 'created_at'],
        'gf_route_plan': ['id', 'route_id', 'plan_data', 'created_at', 'updated_at'],
        'gf_user_roles': ['id', 'user_id', 'role_id', 'assigned_at'],
        'gf_vehicle_costs': ['id', 'vehicle_id', 'cost_type', 'amount', 'date', 'description'],
        'gf_vehicle_maintenance': ['id', 'vehicle_id', 'maintenance_type', 'cost', 'date', 'description']
    }
    
    expected_views = [
        'v_driver_last_position',
        'v_active_trips', 
        'v_route_stops'
    ]
    
    expected_functions = [
        'get_driver_position_lat',
        'get_driver_position_lng',
        'get_user_name',
        'gf_map_snapshot_full'
    ]
    
    return expected_tables, expected_views, expected_functions

def main():
    print("🔍 Analisando esquema completo do Supabase...")
    
    try:
        conn = connect_db()
        cursor = conn.cursor()
        
        # Obter estado atual
        print("\n=== ESTADO ATUAL DO BANCO ===")
        
        tables = get_all_tables(cursor)
        views = get_all_views(cursor)
        functions = get_all_functions(cursor)
        foreign_keys = check_foreign_keys(cursor)
        rls_policies = check_rls_policies(cursor)
        indexes = check_indexes(cursor)
        
        print(f"📊 Tabelas encontradas: {len(tables)}")
        for table_name, table_type in tables:
            print(f"  - {table_name} ({table_type})")
        
        print(f"\n👁️  Views encontradas: {len(views)}")
        for view in views:
            print(f"  - {view}")
        
        print(f"\n⚙️  Funções encontradas: {len(functions)}")
        for func_name, return_type, func_type in functions:
            print(f"  - {func_name}() -> {return_type} ({func_type})")
        
        # Comparar com o esperado
        expected_tables, expected_views, expected_functions = analyze_expected_tables()
        
        print(f"\n=== ANÁLISE DE COMPLETUDE ===")
        
        # Verificar tabelas ausentes
        current_table_names = {name for name, _ in tables}
        missing_tables = set(expected_tables.keys()) - current_table_names
        extra_tables = current_table_names - set(expected_tables.keys()) - {'gf_route_plan'}  # gf_route_plan pode existir
        
        if missing_tables:
            print(f"\n❌ Tabelas AUSENTES ({len(missing_tables)}):")
            for table in sorted(missing_tables):
                print(f"  - {table}")
        else:
            print(f"\n✅ Todas as tabelas principais estão presentes")
        
        if extra_tables:
            print(f"\n⚠️  Tabelas EXTRAS ({len(extra_tables)}):")
            for table in sorted(extra_tables):
                print(f"  - {table}")
        
        # Verificar views ausentes
        missing_views = set(expected_views) - set(views)
        if missing_views:
            print(f"\n❌ Views AUSENTES ({len(missing_views)}):")
            for view in sorted(missing_views):
                print(f"  - {view}")
        else:
            print(f"\n✅ Todas as views estão presentes")
        
        # Verificar funções ausentes
        current_function_names = {name for name, _, _ in functions}
        missing_functions = set(expected_functions) - current_function_names
        if missing_functions:
            print(f"\n❌ Funções AUSENTES ({len(missing_functions)}):")
            for func in sorted(missing_functions):
                print(f"  - {func}")
        else:
            print(f"\n✅ Todas as funções estão presentes")
        
        # Verificar estrutura das tabelas existentes
        print(f"\n=== ANÁLISE DE ESTRUTURA ===")
        
        problematic_tables = []
        for table_name in current_table_names:
            if table_name in expected_tables:
                columns = check_table_columns(cursor, table_name)
                current_columns = {col[0] for col in columns}
                expected_columns = set(expected_tables[table_name])
                
                missing_cols = expected_columns - current_columns
                if missing_cols:
                    print(f"\n⚠️  {table_name} - Colunas ausentes: {', '.join(sorted(missing_cols))}")
                    problematic_tables.append(table_name)
        
        # Verificar chaves estrangeiras
        print(f"\n=== RELACIONAMENTOS ===")
        print(f"🔗 Chaves estrangeiras: {len(foreign_keys)}")
        
        fk_by_table = {}
        for table, column, ref_table, ref_column, constraint in foreign_keys:
            if table not in fk_by_table:
                fk_by_table[table] = []
            fk_by_table[table].append(f"{column} -> {ref_table}.{ref_column}")
        
        for table, fks in fk_by_table.items():
            print(f"  {table}:")
            for fk in fks:
                print(f"    - {fk}")
        
        # Verificar RLS
        print(f"\n=== SEGURANÇA (RLS) ===")
        print(f"🔒 Políticas RLS: {len(rls_policies)}")
        
        rls_by_table = {}
        for schema, table, policy, permissive, roles, cmd, qual, with_check in rls_policies:
            if table not in rls_by_table:
                rls_by_table[table] = []
            rls_by_table[table].append(f"{policy} ({cmd})")
        
        for table, policies in rls_by_table.items():
            print(f"  {table}: {len(policies)} políticas")
            for policy in policies:
                print(f"    - {policy}")
        
        # Verificar índices
        print(f"\n=== PERFORMANCE (ÍNDICES) ===")
        print(f"📈 Índices: {len(indexes)}")
        
        idx_by_table = {}
        for table, index, is_unique, is_primary, columns in indexes:
            if table not in idx_by_table:
                idx_by_table[table] = []
            idx_type = "PRIMARY" if is_primary else "UNIQUE" if is_unique else "INDEX"
            idx_by_table[table].append(f"{index} ({idx_type}) on {columns}")
        
        for table, indices in idx_by_table.items():
            print(f"  {table}: {len(indices)} índices")
        
        # Resumo final
        print(f"\n=== RESUMO FINAL ===")
        
        issues = []
        if missing_tables:
            issues.append(f"{len(missing_tables)} tabelas ausentes")
        if missing_views:
            issues.append(f"{len(missing_views)} views ausentes")
        if missing_functions:
            issues.append(f"{len(missing_functions)} funções ausentes")
        if problematic_tables:
            issues.append(f"{len(problematic_tables)} tabelas com colunas ausentes")
        
        if issues:
            print(f"❌ Problemas encontrados:")
            for issue in issues:
                print(f"  - {issue}")
            print(f"\n🔧 Ação necessária: Executar correções")
        else:
            print(f"✅ Banco de dados está completo e funcional!")
        
        # Salvar relatório detalhado
        report = {
            'timestamp': str(cursor.execute("SELECT NOW();")),
            'tables': {name: [col[0] for col in check_table_columns(cursor, name)] for name, _ in tables},
            'views': views,
            'functions': [name for name, _, _ in functions],
            'missing_tables': list(missing_tables),
            'missing_views': list(missing_views),
            'missing_functions': list(missing_functions),
            'foreign_keys': len(foreign_keys),
            'rls_policies': len(rls_policies),
            'indexes': len(indexes)
        }
        
        report_path = ROOT / "tools" / "db" / "schema_analysis_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Relatório detalhado salvo em: {report_path}")
        
        return 0 if not issues else 1
        
    except Exception as e:
        print(f"\n❌ Erro durante análise: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    sys.exit(main())