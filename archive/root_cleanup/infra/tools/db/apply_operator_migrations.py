#!/usr/bin/env python3
"""
Aplica migrações do painel do operador no Supabase:
- gf_operator_tables.sql
- gf_operator_rls.sql
- gf_operator_views.sql
- gf_operator_rpcs.sql

Inclui pequenos pré-requisitos (extensão e colunas auxiliares) para evitar falhas.
"""
import sys
from pathlib import Path

import psycopg2

ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = ROOT / "database" / "migrations"


def load_sql(path: Path) -> str:
    with path.open("r", encoding="utf-8") as f:
        return f.read()


def connect_db():
    # Reutiliza padrão do projeto (variáveis GF_DB_* ou defaults válidos)
    import os
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
        msg = str(e)
        benign = (
            "already exists",
            "duplicate key value",
            "DuplicateObject",
            "column already exists",
        )
        if any(s in msg for s in benign):
            print(f"Aviso: {label}: {e}")
        else:
            raise
    print(f"Concluído: {label}")


def main():
    conn = connect_db()
    cur = conn.cursor()

    try:
        # Pré-requisitos
        exec_sql(cur, "CREATE EXTENSION pgcrypto", 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
        # As views do operador dependem de companies.role; garantir coluna
        exec_sql(
            cur,
            "Garantir coluna companies.role",
            "ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'company';",
        )

        # Ordem: tabelas -> RLS -> views -> RPCs
        files = [
            ("gf_operator_tables.sql", SQL_DIR / "gf_operator_tables.sql"),
            ("gf_operator_rls.sql", SQL_DIR / "gf_operator_rls.sql"),
            ("gf_operator_views.sql", SQL_DIR / "gf_operator_views.sql"),
            ("gf_operator_rpcs.sql", SQL_DIR / "gf_operator_rpcs.sql"),
        ]

        for label, path in files:
            sql_text = load_sql(path)
            exec_sql(cur, label, sql_text)

        # Ajuste básico: marcar uma empresa como 'company' e outra como 'carrier' para testes
        exec_sql(
            cur,
            "Seed roles em companies",
            """
            DO $$
            DECLARE
              c1 uuid; c2 uuid;
            BEGIN
              SELECT id INTO c1 FROM public.companies ORDER BY created_at NULLS LAST LIMIT 1;
              SELECT id INTO c2 FROM public.companies ORDER BY created_at NULLS LAST OFFSET 1 LIMIT 1;
              IF c1 IS NOT NULL THEN
                UPDATE public.companies SET role='company' WHERE id=c1;
              END IF;
              IF c2 IS NOT NULL THEN
                UPDATE public.companies SET role='carrier' WHERE id=c2;
              END IF;
            END$$;
            """,
        )

        # Verificação rápida
        print("\n--- Verificando objetos do operador ---")
        cur.execute(
            """
            SELECT table_name FROM information_schema.views 
            WHERE table_schema='public' AND table_name LIKE 'v_operator_%' 
            ORDER BY table_name;
            """
        )
        views = [r[0] for r in cur.fetchall()]
        print("Views do operador:", views)

        print("\n✅ Migrações do operador aplicadas com sucesso.")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)

