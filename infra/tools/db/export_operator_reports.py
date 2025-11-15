#!/usr/bin/env python3
"""
Exporta relatórios do operador para CSV usando views públicas:
- v_operator_routes
- v_operator_dashboard_kpis
- v_operator_sla

Gera arquivos CSV em tools/db/exports/.
"""
import csv
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "tools" / "db" / "exports"


def supabase_client():
    from supabase import create_client
    def parse_env_local(path: Path) -> dict:
        env = {}
        if not path.exists():
            return env
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line or line.strip().startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
        return env

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        env_local = parse_env_local(ROOT / "web-app" / ".env.local")
        url = url or env_local.get("NEXT_PUBLIC_SUPABASE_URL")
        key = key or env_local.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("Supabase URL/Anon Key não configurados.")
    return create_client(url, key)


def export_csv(filename: str, rows: list):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if not rows:
        print(f"Sem dados para {filename}")
        return
    headers = list(rows[0].keys())
    with (OUT_DIR / filename).open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Exportado: {OUT_DIR / filename} ({len(rows)} linhas)")


def main():
    # Usa sessão do operador (se já autenticado anteriormente) ou anon
    supabase = supabase_client()

    # Views do operador
    views = [
        ("v_operator_routes.csv", "v_operator_routes"),
        ("v_operator_dashboard_kpis.csv", "v_operator_dashboard_kpis"),
        ("v_operator_sla.csv", "v_operator_sla"),
    ]

    for fname, view in views:
        try:
            data = supabase.table(view).select("*").execute().data
            export_csv(fname, data)
        except Exception as e:
            print(f"Falha ao exportar {view}: {e}")

    print("\n✅ Exportações concluídas.")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)

