import os
from pathlib import Path

import psycopg2


def read_sql(path: Path) -> str:
    with path.open('r', encoding='utf-8') as f:
        return f.read()


def main():
    # Prefer env vars if present; fall back to provided credentials
    user = os.getenv('PGUSER', 'postgres')
    password = os.getenv('PGPASSWORD', 'Guigui1309@')
    host = os.getenv('PGHOST', 'db.vmoxzesvjcfmrebagcwo.supabase.co')
    port = int(os.getenv('PGPORT', '5432'))
    dbname = os.getenv('PGDATABASE', 'postgres')

    print(f"Connecting to {host}:{port}/{dbname} as {user}...")
    conn = psycopg2.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        dbname=dbname,
    )
    conn.autocommit = True
    cur = conn.cursor()
    print("Connection successful!")

    # Ensure pgcrypto for gen_random_uuid()
    cur.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
    print("Ensured extension pgcrypto.")

    # Resolve repo root and migrations dir
    repo_root = Path(__file__).resolve().parents[3]
    migrations_dir = repo_root / 'database' / 'migrations'

    # Create helper functions required by policies (from migration_v7_4_canonical.sql)
    print("Creating helper functions for RLS policies...")
    cur.execute(
        """
        CREATE OR REPLACE FUNCTION get_user_role()
        RETURNS TEXT AS $$
          SELECT role FROM users WHERE id = auth.uid()
        $$ LANGUAGE sql STABLE SECURITY DEFINER;

        CREATE OR REPLACE FUNCTION get_user_company_id()
        RETURNS UUID AS $$
          SELECT company_id FROM users WHERE id = auth.uid()
        $$ LANGUAGE sql STABLE SECURITY DEFINER;

        CREATE OR REPLACE FUNCTION get_user_carrier_id()
        RETURNS TEXT AS $$
          SELECT carrier_id FROM users WHERE id = auth.uid()
        $$ LANGUAGE sql STABLE SECURITY DEFINER;
        """
    )
    print("Helper functions created.")

    # Order: tables -> views -> RPC (avoid dependency issues)
    files_in_order = [
        migrations_dir / 'gf_tables_auxiliares.sql',
        migrations_dir / 'gf_views.sql',
        migrations_dir / 'gf_rpc_map_snapshot.sql',
    ]

    for path in files_in_order:
        print(f"Executing {path.name}...")
        sql = read_sql(path)
        cur.execute(sql)
        print(f"Executed {path.name} successfully.")

    # Verification queries
    print("Verifying created objects...")
    cur.execute(
        """
        SELECT table_name FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name IN ('v_driver_last_position', 'v_active_trips', 'v_route_stops')
        ORDER BY table_name;
        """
    )
    views = [row[0] for row in cur.fetchall()]
    print("Views:", views)

    cur.execute(
        """
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'gf_%'
        ORDER BY table_name;
        """
    )
    tables = [row[0] for row in cur.fetchall()]
    print(f"gf_ tables count: {len(tables)}")
    print("gf_ tables:", tables)

    cur.execute(
        """
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'gf_map_snapshot_full';
        """
    )
    rpc = [row[0] for row in cur.fetchall()]
    print("RPCs:", rpc)

    # Test RPC execution
    print("Testing RPC gf_map_snapshot_full()...")
    cur.execute("SELECT public.gf_map_snapshot_full();")
    result = cur.fetchone()[0]
    print("RPC result sample size (chars):", len(str(result)))

    cur.close()
    conn.close()
    print("All done. Connection closed.")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Failed to apply migrations: {e}")
        raise