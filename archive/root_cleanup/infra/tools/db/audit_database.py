#!/usr/bin/env python3
"""
Script para auditar o banco de dados Supabase e listar todas as tabelas, views e RPCs
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Conecta ao banco usando variáveis de ambiente"""
    host = os.getenv('GF_DB_HOST', 'db.vmoxzesvjcfmrebagcwo.supabase.co')
    port = os.getenv('GF_DB_PORT', '5432')
    user = os.getenv('GF_DB_USER', 'postgres')
    password = os.getenv('GF_DB_PASSWORD', 'Guigui1309@')
    dbname = os.getenv('GF_DB_NAME', 'postgres')
    
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
        print(f"Erro ao conectar: {e}", file=sys.stderr)
        sys.exit(1)

def query_tables(conn):
    """Lista todas as tabelas"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        return [row['table_name'] for row in cur.fetchall()]

def query_views(conn):
    """Lista todas as views"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.views
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        return [row['table_name'] for row in cur.fetchall()]

def query_rpcs(conn):
    """Lista todas as RPCs (funções)"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT routine_name 
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            ORDER BY routine_name;
        """)
        return [row['routine_name'] for row in cur.fetchall()]

def main():
    conn = get_db_connection()
    
    try:
        tables = query_tables(conn)
        views = query_views(conn)
        rpcs = query_rpcs(conn)
        
        print("=== TABELAS ===")
        for table in tables:
            print(f"  - {table}")
        
        print(f"\n=== VIEWS ===")
        for view in views:
            print(f"  - {view}")
        
        print(f"\n=== RPCs (FUNÇÕES) ===")
        for rpc in rpcs:
            print(f"  - {rpc}")
        
        # Verificar tabelas específicas gf_
        gf_tables = [t for t in tables if t.startswith('gf_')]
        print(f"\n=== TABELAS gf_ ({len(gf_tables)}) ===")
        for table in gf_tables:
            print(f"  - {table}")
        
        # Verificar views esperadas
        expected_views = [
            'v_dashboard_kpis',
            'v_driver_last_position',
            'v_active_trips',
            'v_route_costs',
            'v_driver_last_status'
        ]
        print(f"\n=== VIEWS ESPERADAS ===")
        for view in expected_views:
            status = "✅" if view in views else "❌"
            print(f"  {status} {view}")
        
        # Verificar RPCs esperadas
        expected_rpcs = [
            'rpc_generate_route_stops',
            'rpc_optimize_route_google',
            'rpc_validate_boarding',
            'gf_map_snapshot_full'
        ]
        print(f"\n=== RPCs ESPERADAS ===")
        for rpc in expected_rpcs:
            status = "✅" if rpc in rpcs else "❌"
            print(f"  {status} {rpc}")
        
        # Tabelas esperadas gf_
        expected_gf_tables = [
            'gf_notifications',
            'gf_assistance_requests',
            'gf_gamification_scores',
            'gf_vehicle_costs',
            'gf_boarding_tokens',
            'gf_boarding_events',
            'gf_employee_company'
        ]
        print(f"\n=== TABELAS gf_ ESPERADAS ===")
        for table in expected_gf_tables:
            status = "✅" if table in tables else "❌"
            print(f"  {status} {table}")
        
    finally:
        conn.close()

if __name__ == '__main__':
    main()

