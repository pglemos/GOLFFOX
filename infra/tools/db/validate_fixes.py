#!/usr/bin/env python3
"""
Script para validar as correções aplicadas no banco de dados
"""
import os
import sys
from pathlib import Path
import psycopg2

# Adicionar o diretório raiz ao path para importar run_migrations
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "db"))

from run_migrations import connect_db

def validate_function_types(cursor):
    """Valida os tipos de retorno das funções helper"""
    print("\n=== Validando tipos de retorno das funções ===")
    
    query = """
    SELECT 
        routine_name, 
        data_type,
        type_udt_name
    FROM information_schema.routines 
    WHERE routine_name IN ('get_driver_position_lat', 'get_driver_position_lng') 
    AND routine_schema = 'public'
    ORDER BY routine_name;
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    
    for row in results:
        routine_name, data_type, type_udt_name = row
        print(f"  {routine_name}: {data_type} ({type_udt_name})")
        
        # Verificar se é double precision
        if type_udt_name == 'float8':
            print(f"    ✅ {routine_name} retorna double precision corretamente")
        else:
            print(f"    ❌ {routine_name} deveria retornar double precision, mas retorna {type_udt_name}")
    
    return results

def validate_view_columns(cursor):
    """Valida os tipos de colunas das views"""
    print("\n=== Validando tipos de colunas das views ===")
    
    query = """
    SELECT 
        table_name,
        column_name,
        data_type,
        udt_name
    FROM information_schema.columns 
    WHERE table_name IN ('v_driver_last_position', 'v_active_trips')
    AND table_schema = 'public'
    AND column_name IN ('lat', 'lng', 'latitude', 'longitude')
    ORDER BY table_name, column_name;
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    
    for row in results:
        table_name, column_name, data_type, udt_name = row
        print(f"  {table_name}.{column_name}: {data_type} ({udt_name})")
        
        # Verificar se é double precision
        if udt_name == 'float8':
            print(f"    ✅ {table_name}.{column_name} é double precision")
        else:
            print(f"    ❌ {table_name}.{column_name} deveria ser double precision, mas é {udt_name}")
    
    return results

def test_functions(cursor):
    """Testa as funções com dados reais"""
    print("\n=== Testando funções com dados reais ===")
    
    # Primeiro, verificar se há dados na tabela driver_positions
    cursor.execute("SELECT COUNT(*) FROM driver_positions LIMIT 1;")
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("  ⚠️  Não há dados na tabela driver_positions para testar")
        return
    
    # Testar as funções
    test_query = """
    SELECT 
        id,
        public.get_driver_position_lat(id) as helper_lat,
        public.get_driver_position_lng(id) as helper_lng
    FROM drivers 
    LIMIT 3;
    """
    
    try:
        cursor.execute(test_query)
        results = cursor.fetchall()
        
        print(f"  Testando com {len(results)} drivers:")
        for row in results:
            driver_id, lat, lng = row
            print(f"    Driver {driver_id}: lat={lat}, lng={lng}")
            
        print("  ✅ Funções executaram sem erro")
        
    except Exception as e:
        print(f"  ❌ Erro ao testar funções: {e}")

def test_views(cursor):
    """Testa as views"""
    print("\n=== Testando views ===")
    
    views_to_test = [
        'v_driver_last_position',
        'v_active_trips',
        'v_route_stops'
    ]
    
    for view_name in views_to_test:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {view_name};")
            count = cursor.fetchone()[0]
            print(f"  ✅ {view_name}: {count} registros")
            
            # Testar uma consulta simples
            if view_name == 'v_driver_last_position':
                cursor.execute(f"SELECT driver_id, lat, lng FROM {view_name} LIMIT 3;")
                results = cursor.fetchall()
                for row in results:
                    driver_id, lat, lng = row
                    print(f"    Driver {driver_id}: lat={lat} ({type(lat).__name__}), lng={lng} ({type(lng).__name__})")
                    
        except Exception as e:
            print(f"  ❌ Erro na view {view_name}: {e}")

def test_rpc(cursor):
    """Testa o RPC gf_map_snapshot_full"""
    print("\n=== Testando RPC gf_map_snapshot_full ===")
    
    try:
        cursor.execute("SELECT public.gf_map_snapshot_full();")
        result = cursor.fetchone()[0]
        
        if isinstance(result, dict):
            print("  ✅ RPC executou com sucesso")
            print(f"    Chaves retornadas: {list(result.keys())}")
            
            # Verificar estrutura básica
            expected_keys = ['buses', 'stops', 'garages', 'routes', 'timestamp']
            for key in expected_keys:
                if key in result:
                    print(f"    ✅ {key}: presente")
                else:
                    print(f"    ❌ {key}: ausente")
        else:
            print(f"  ⚠️  RPC retornou tipo inesperado: {type(result)}")
            
    except Exception as e:
        print(f"  ❌ Erro no RPC: {e}")

def main():
    print("🔍 Validando correções do banco de dados...")
    
    try:
        conn = connect_db()
        cursor = conn.cursor()
        
        # Executar todas as validações
        validate_function_types(cursor)
        validate_view_columns(cursor)
        test_functions(cursor)
        test_views(cursor)
        test_rpc(cursor)
        
        print("\n✅ Validação concluída!")
        
    except Exception as e:
        print(f"\n❌ Erro durante validação: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        if 'conn' in locals():
            conn.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())