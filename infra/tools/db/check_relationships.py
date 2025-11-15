#!/usr/bin/env python3
"""
Script para verificar e validar relacionamentos de tabelas e chaves estrangeiras
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

def check_foreign_keys(conn):
    """Verifica todas as chaves estrangeiras e seus relacionamentos"""
    print("🔍 Verificando chaves estrangeiras...")
    
    query = """
    SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name,
        rc.update_rule,
        rc.delete_rule
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
    """
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query)
        foreign_keys = cur.fetchall()
    
    print(f"✅ Encontradas {len(foreign_keys)} chaves estrangeiras")
    return foreign_keys

def check_orphaned_records(conn, foreign_keys):
    """Verifica registros órfãos (que referenciam IDs inexistentes)"""
    print("\n🔍 Verificando registros órfãos...")
    
    orphaned_records = []
    
    for fk in foreign_keys:
        table = fk['table_name']
        column = fk['column_name']
        ref_table = fk['foreign_table_name']
        ref_column = fk['foreign_column_name']
        
        # Pular verificações para tabelas que podem não existir ainda
        skip_tables = ['auth.users']
        if ref_table in skip_tables:
            continue
            
        query = f"""
        SELECT COUNT(*) as orphaned_count
        FROM {table} t
        WHERE t.{column} IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM {ref_table} r 
            WHERE r.{ref_column} = t.{column}
        );
        """
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                result = cur.fetchone()
                
                if result['orphaned_count'] > 0:
                    orphaned_records.append({
                        'table': table,
                        'column': column,
                        'ref_table': ref_table,
                        'ref_column': ref_column,
                        'orphaned_count': result['orphaned_count']
                    })
                    print(f"⚠️  {table}.{column} -> {ref_table}.{ref_column}: {result['orphaned_count']} registros órfãos")
                else:
                    print(f"✅ {table}.{column} -> {ref_table}.{ref_column}: OK")
                    
        except Exception as e:
            print(f"❌ Erro ao verificar {table}.{column}: {e}")
    
    return orphaned_records

def check_missing_indexes(conn, foreign_keys):
    """Verifica se existem índices nas chaves estrangeiras para performance"""
    print("\n🔍 Verificando índices em chaves estrangeiras...")
    
    missing_indexes = []
    
    for fk in foreign_keys:
        table = fk['table_name']
        column = fk['column_name']
        
        query = """
        SELECT COUNT(*) as index_count
        FROM pg_indexes 
        WHERE tablename = %s 
        AND (indexdef LIKE %s OR indexdef LIKE %s);
        """
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (table, f'%({column})%', f'%{column}%'))
                result = cur.fetchone()
                
                if result['index_count'] == 0:
                    missing_indexes.append({
                        'table': table,
                        'column': column
                    })
                    print(f"⚠️  Índice ausente: {table}.{column}")
                else:
                    print(f"✅ Índice existe: {table}.{column}")
                    
        except Exception as e:
            print(f"❌ Erro ao verificar índice {table}.{column}: {e}")
    
    return missing_indexes

def check_table_relationships(conn):
    """Verifica relacionamentos lógicos entre tabelas principais"""
    print("\n🔍 Verificando relacionamentos lógicos...")
    
    relationships_to_check = [
        {
            'name': 'Users -> Companies (via drivers)',
            'query': """
                SELECT COUNT(*) as count FROM users u 
                WHERE EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id)
            """
        },
        {
            'name': 'Drivers -> Vehicles (via trips)',
            'query': """
                SELECT COUNT(*) as count FROM drivers d 
                WHERE EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = d.id)
            """
        },
        {
            'name': 'Routes -> Bus Stops',
            'query': """
                SELECT COUNT(*) as count FROM routes r 
                WHERE EXISTS (SELECT 1 FROM bus_stops bs WHERE bs.route_id = r.id)
            """
        },
        {
            'name': 'Trips -> Driver Positions',
            'query': """
                SELECT COUNT(*) as count FROM trips t 
                WHERE EXISTS (SELECT 1 FROM driver_positions dp WHERE dp.driver_id = t.driver_id)
            """
        }
    ]
    
    relationship_stats = []
    
    for rel in relationships_to_check:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(rel['query'])
                result = cur.fetchone()
                
                relationship_stats.append({
                    'name': rel['name'],
                    'count': result['count']
                })
                print(f"📊 {rel['name']}: {result['count']} registros relacionados")
                
        except Exception as e:
            print(f"❌ Erro ao verificar {rel['name']}: {e}")
            relationship_stats.append({
                'name': rel['name'],
                'error': str(e)
            })
    
    return relationship_stats

def create_missing_indexes_sql(missing_indexes):
    """Gera SQL para criar índices ausentes"""
    if not missing_indexes:
        return ""
    
    sql_statements = []
    sql_statements.append("-- Criando índices ausentes para chaves estrangeiras")
    
    for idx in missing_indexes:
        table = idx['table']
        column = idx['column']
        index_name = f"idx_{table}_{column}"
        sql = f"CREATE INDEX IF NOT EXISTS {index_name} ON public.{table}({column});"
        sql_statements.append(sql)
    
    return "\n".join(sql_statements)

def fix_orphaned_records_sql(orphaned_records):
    """Gera SQL para corrigir registros órfãos (comentado para segurança)"""
    if not orphaned_records:
        return ""
    
    sql_statements = []
    sql_statements.append("-- ATENÇÃO: Comandos para corrigir registros órfãos")
    sql_statements.append("-- Revise cuidadosamente antes de executar!")
    sql_statements.append("")
    
    for orphan in orphaned_records:
        table = orphan['table']
        column = orphan['column']
        count = orphan['orphaned_count']
        
        sql_statements.append(f"-- {table}.{column}: {count} registros órfãos")
        sql_statements.append(f"-- DELETE FROM {table} WHERE {column} IS NOT NULL")
        sql_statements.append(f"--   AND NOT EXISTS (SELECT 1 FROM {orphan['ref_table']} WHERE {orphan['ref_column']} = {table}.{column});")
        sql_statements.append("")
    
    return "\n".join(sql_statements)

def main():
    print("🚀 Iniciando verificação de relacionamentos e chaves estrangeiras...")
    
    # Conectar ao banco
    conn = get_db_connection()
    if not conn:
        print("❌ Falha na conexão com o banco de dados")
        sys.exit(1)
    
    try:
        # Verificar chaves estrangeiras
        foreign_keys = check_foreign_keys(conn)
        
        # Verificar registros órfãos
        orphaned_records = check_orphaned_records(conn, foreign_keys)
        
        # Verificar índices ausentes
        missing_indexes = check_missing_indexes(conn, foreign_keys)
        
        # Verificar relacionamentos lógicos
        relationship_stats = check_table_relationships(conn)
        
        # Gerar relatório
        report = {
            'timestamp': datetime.now().isoformat(),
            'foreign_keys_count': len(foreign_keys),
            'foreign_keys': [dict(fk) for fk in foreign_keys],
            'orphaned_records': orphaned_records,
            'missing_indexes': missing_indexes,
            'relationship_stats': relationship_stats
        }
        
        # Salvar relatório
        report_file = 'tools/db/relationships_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # Gerar SQL de correção
        fix_sql = []
        
        # Índices ausentes
        indexes_sql = create_missing_indexes_sql(missing_indexes)
        if indexes_sql:
            fix_sql.append(indexes_sql)
        
        # Registros órfãos (comentado)
        orphans_sql = fix_orphaned_records_sql(orphaned_records)
        if orphans_sql:
            fix_sql.append(orphans_sql)
        
        if fix_sql:
            fix_file = 'database/migrations/fix_relationships.sql'
            with open(fix_file, 'w', encoding='utf-8') as f:
                f.write("\n\n".join(fix_sql))
            print(f"\n📄 SQL de correção gerado: {fix_file}")
        
        # Resumo
        print(f"\n📊 RESUMO:")
        print(f"   • Chaves estrangeiras: {len(foreign_keys)}")
        print(f"   • Registros órfãos: {len(orphaned_records)}")
        print(f"   • Índices ausentes: {len(missing_indexes)}")
        print(f"   • Relatório salvo: {report_file}")
        
        if orphaned_records:
            print(f"\n⚠️  ATENÇÃO: {len(orphaned_records)} tabelas com registros órfãos encontradas!")
            for orphan in orphaned_records:
                print(f"   • {orphan['table']}.{orphan['column']}: {orphan['orphaned_count']} registros")
        
        if missing_indexes:
            print(f"\n⚠️  ATENÇÃO: {len(missing_indexes)} índices ausentes encontrados!")
            for idx in missing_indexes:
                print(f"   • {idx['table']}.{idx['column']}")
        
        if not orphaned_records and not missing_indexes:
            print("\n✅ Todos os relacionamentos estão íntegros!")
        
        # Código de saída baseado nos problemas encontrados
        exit_code = len(orphaned_records) + len(missing_indexes)
        sys.exit(min(exit_code, 1))  # Máximo 1 para indicar problemas
        
    except Exception as e:
        print(f"❌ Erro durante a verificação: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()