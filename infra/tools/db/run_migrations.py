import os
import sys
import json
import traceback
from pathlib import Path

import psycopg2


ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = ROOT / "database" / "migrations"


def load_sql(path: Path) -> str:
    with path.open("r", encoding="utf-8") as f:
        return f.read()


def connect_db():
    # Connection settings (provided by user)
    host = os.environ.get("GF_DB_HOST", "db.vmoxzesvjcfmrebagcwo.supabase.co")
    port = int(os.environ.get("GF_DB_PORT", "5432"))
    user = os.environ.get("GF_DB_USER", "postgres")
    password = os.environ.get("GF_DB_PASSWORD", "Guigui1309@")
    dbname = os.environ.get("GF_DB_NAME", "postgres")

    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=dbname,
        sslmode="require",
    )
    conn.autocommit = True
    return conn


def exec_sql(cursor, label: str, sql_text: str):
    print(f"\n--- Executando: {label} ---")
    try:
        cursor.execute(sql_text)
    except Exception as e:
        # Tornar reentrante: muitos CREATE podem já existir
        msg = str(e)
        benign = (
            "already exists",
            "duplicate key value",
            "DuplicateObject",
        )
        if any(s in msg for s in benign):
            print(f"Aviso: {label}: {e}")
        else:
            raise
    print(f"Concluído: {label}")


def verify(cursor):
    print("\n--- Verificando objetos criados ---")
    cursor.execute(
        """
        SELECT table_name FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name IN ('v_driver_last_position', 'v_active_trips', 'v_route_stops')
        ORDER BY table_name;
        """
    )
    views = [r[0] for r in cursor.fetchall()]
    print("Views:", views)

    cursor.execute(
        """
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'gf_%'
        ORDER BY table_name;
        """
    )
    tables = [r[0] for r in cursor.fetchall()]
    print("Tabelas gf_:", tables)

    cursor.execute(
        """
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'gf_map_snapshot_full';
        """
    )
    rpc = [r[0] for r in cursor.fetchall()]
    print("RPCs:", rpc)

    # Teste rápido da RPC (não falha se der erro, só reporta)
    try:
        cursor.execute("SELECT public.gf_map_snapshot_full(NULL, NULL);")
        result = cursor.fetchone()[0]
        # Imprimir apenas chaves do JSON para evitar logs longos
        if isinstance(result, dict):
            print("RPC retorno (chaves):", list(result.keys()))
        else:
            # Se vier como str JSON, tente carregar
            try:
                obj = json.loads(result)
                print("RPC retorno (chaves):", list(obj.keys()))
            except Exception:
                print("RPC retorno (tipo):", type(result))
    except Exception as e:
        print("Aviso: falha ao invocar RPC gf_map_snapshot_full:", e)


def main():
    try:
        conn = connect_db()
        cur = conn.cursor()

        # Pré-requisitos
        exec_sql(cur, "CREATE EXTENSION pgcrypto", 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

        # Executar arquivos em ordem
        files = [
            ("gf_tables_auxiliares.sql", SQL_DIR / "gf_tables_auxiliares.sql"),
            ("gf_views.sql", SQL_DIR / "gf_views.sql"),
            ("gf_rpc_map_snapshot.sql", SQL_DIR / "gf_rpc_map_snapshot.sql"),
        ]

        for label, path in files:
            sql_text = load_sql(path)
            exec_sql(cur, label, sql_text)

        # Verificação
        verify(cur)

        cur.close()
        conn.close()
        print("\nTudo concluído com sucesso.")
    except Exception as e:
        print("Erro durante execução:")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
