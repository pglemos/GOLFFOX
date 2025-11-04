#!/usr/bin/env python3
"""
Testes end-to-end com usuário operador real:
- Provisiona (ou reutiliza) um usuário operador e vincula a uma empresa.
- Valida RLS: operador só enxerga dados da própria empresa em rotas e funcionários.
- Testa importação CSV simulada: cria 3 funcionários e associa via gf_employee_company.
- Testa RPCs: rpc_request_service e rpc_request_route_change.
"""
import os
import sys
from pathlib import Path
from typing import Optional, List

import psycopg2

ROOT = Path(__file__).resolve().parents[2]


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


def connect_db():
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


def supabase_client():
    # Tenta carregar do ambiente ou .env.local
    from supabase import create_client

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        env_local = parse_env_local(ROOT / "web-app" / ".env.local")
        url = url or env_local.get("NEXT_PUBLIC_SUPABASE_URL")
        key = key or env_local.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("Supabase URL/Anon Key não configurados.")
    return create_client(url, key)


def get_or_create_companies(cur) -> List[str]:
    cur.execute("SELECT id, role FROM public.companies ORDER BY created_at NULLS LAST;")
    rows = cur.fetchall()
    if not rows:
        cur.execute(
            "INSERT INTO public.companies(name, cnpj, address, role) VALUES (%s, %s, %s, %s) RETURNING id",
            ("Empresa Teste", "00.000.000/0000-00", "Rua A, 123", "company"),
        )
        cid1 = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO public.companies(name, cnpj, address, role) VALUES (%s, %s, %s, %s) RETURNING id",
            ("Transportadora Teste", "11.111.111/1111-11", "Rua B, 456", "carrier"),
        )
        cid2 = cur.fetchone()[0]
        return [cid1, cid2]
    else:
        ids = [r[0] for r in rows]
        # Marcar primeiro como company e segundo como carrier (se existir)
        if len(ids) >= 1:
            cur.execute("UPDATE public.companies SET role='company' WHERE id=%s", (ids[0],))
        if len(ids) >= 2:
            cur.execute("UPDATE public.companies SET role='carrier' WHERE id=%s", (ids[1],))
        return ids[:2]


def provision_operator(supabase, cur, empresa_id: str) -> dict:
    email = "operador.teste@golffox.com"
    password = "Teste@12345"

    # Tenta login; se falhar, faz sign_up
    try:
        auth = supabase.auth.sign_in_with_password({"email": email, "password": password})
    except Exception:
        auth = supabase.auth.sign_up({"email": email, "password": password})

    user_id = auth.user.id

    # Vincular role/operator e company_id na tabela users
    cur.execute(
        "UPDATE public.users SET role='operator', company_id=%s WHERE id=%s",
        (empresa_id, user_id),
    )
    print(f"Operador '{email}' vinculado à empresa {empresa_id}")
    return {"email": email, "password": password, "user_id": user_id}


def ensure_sample_routes(cur, empresa_id: str, other_empresa_id: Optional[str]):
    # Cria duas rotas, uma para empresa do operador, outra para empresa diferente
    cur.execute("SELECT id FROM public.routes WHERE company_id=%s LIMIT 1", (empresa_id,))
    if not cur.fetchall():
        cur.execute(
            "INSERT INTO public.routes(name, company_id) VALUES (%s, %s)",
            ("Rota Operador 1", empresa_id),
        )
    if other_empresa_id:
        cur.execute("SELECT id FROM public.routes WHERE company_id=%s LIMIT 1", (other_empresa_id,))
        if not cur.fetchall():
            cur.execute(
                "INSERT INTO public.routes(name, company_id) VALUES (%s, %s)",
                ("Rota Outra Empresa", other_empresa_id),
            )


def validate_rls_routes(supabase, empresa_id: str):
    # Deve retornar somente rotas da empresa do operador
    data = supabase.table("routes").select("id,name,company_id").execute().data
    assert all(r["company_id"] == empresa_id for r in data), "RLS falhou: rotas de outras empresas visíveis"
    print(f"RLS OK em routes: {len(data)} rotas visíveis da empresa {empresa_id}")


def simulate_csv_import(supabase, cur, empresa_id: str):
    # Cria 3 usuários funcionários e associa em gf_employee_company
    employees = [
        ("func1@golffox.com", "Func 1"),
        ("func2@golffox.com", "Func 2"),
        ("func3@golffox.com", "Func 3"),
    ]
    created_ids = []
    for email, name in employees:
        try:
            auth = supabase.auth.sign_in_with_password({"email": email, "password": "Teste@12345"})
        except Exception:
            auth = supabase.auth.sign_up({"email": email, "password": "Teste@12345"})
        uid = auth.user.id
        created_ids.append(uid)
        cur.execute(
            "UPDATE public.users SET role='employee' WHERE id=%s",
            (uid,),
        )
        cur.execute(
            "INSERT INTO public.gf_employee_company(user_id, company_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (uid, empresa_id),
        )
    # Valida leitura restrita da tabela de funcionários via RLS
    data = supabase.table("gf_employee_company").select("user_id,company_id").execute().data
    assert all(r["company_id"] == empresa_id for r in data), "RLS falhou: funcionários de outras empresas visíveis"
    print(f"Importação CSV simulada OK: {len(created_ids)} funcionários vinculados à empresa {empresa_id}")


def test_rpcs(supabase, empresa_id: str):
    # rpc_request_service: deve criar uma solicitação para a empresa do operador
    try:
        result = supabase.rpc("rpc_request_service", {"empresa_id": empresa_id, "subject": "Teste", "description": "Solicitação de teste"}).execute()
        print("rpc_request_service OK:", result.data)
    except Exception as e:
        print("rpc_request_service falhou:", e)

    # rpc_request_route_change: tenta uma alteração fictícia
    try:
        result2 = supabase.rpc("rpc_request_route_change", {"empresa_id": empresa_id, "route_id": None, "change_type": "update", "details": "Mudança de teste"}).execute()
        print("rpc_request_route_change OK:", result2.data)
    except Exception as e:
        print("rpc_request_route_change falhou:", e)


def main():
    conn = connect_db()
    cur = conn.cursor()
    try:
        supabase = supabase_client()

        # Empresas para teste
        ids = get_or_create_companies(cur)
        empresa_id = ids[0]
        outra_empresa_id = ids[1] if len(ids) > 1 else None

        # Provisionar operador
        op = provision_operator(supabase, cur, empresa_id)
        # Reautenticar para garantir sessão fresca
        supabase.auth.sign_in_with_password({"email": op["email"], "password": op["password"]})

        # Dados de exemplo para RLS em rotas
        ensure_sample_routes(cur, empresa_id, outra_empresa_id)

        # Valida RLS em rotas
        validate_rls_routes(supabase, empresa_id)

        # Simula importação CSV de funcionários e valida RLS
        simulate_csv_import(supabase, cur, empresa_id)

        # Testa RPCs principais de solicitações
        test_rpcs(supabase, empresa_id)

        print("\n✅ Testes com operador concluídos.")
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

