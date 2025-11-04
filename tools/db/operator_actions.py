#!/usr/bin/env python3
"""
Utilitários para provisionar operador, validar RLS com sessão simulada
e exportar relatórios CSV das views do painel do operador.
"""
import os
import csv
import json
from pathlib import Path

import psycopg2

# Reutiliza conexão padrão do projeto
ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = ROOT / "database" / "migrations"


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


def ensure_operator_user(cur):
    # Seleciona uma empresa marcada como 'company'
    cur.execute(
        """
        SELECT id FROM public.companies 
        WHERE role = 'company' 
        ORDER BY created_at NULLS LAST LIMIT 1;
        """
    )
    row = cur.fetchone()
    if not row:
        raise RuntimeError("Nenhuma empresa com role='company' encontrada. Execute seed de roles.")
    company_id = row[0]

    # Tenta encontrar usuário operador existente
    cur.execute(
        """
        SELECT id FROM public.users 
        WHERE company_id = %s AND role = 'operator' 
        ORDER BY created_at NULLS LAST LIMIT 1;
        """,
        (company_id,),
    )
    r = cur.fetchone()
    if r:
        return r[0], company_id

    # Tenta promover algum usuário da empresa a operador
    cur.execute(
        """
        SELECT id FROM public.users 
        WHERE company_id = %s 
        ORDER BY created_at NULLS LAST LIMIT 1;
        """,
        (company_id,),
    )
    r = cur.fetchone()
    if r:
        user_id = r[0]
        cur.execute(
            "UPDATE public.users SET role = 'operator' WHERE id = %s;",
            (user_id,),
        )
        return user_id, company_id

    # Sem usuários na empresa: pegar qualquer usuário existente e vincular à empresa
    cur.execute(
        "SELECT id FROM public.users ORDER BY created_at NULLS LAST LIMIT 1;"
    )
    r = cur.fetchone()
    if r:
        user_id = r[0]
        cur.execute(
            "UPDATE public.users SET role = 'operator', company_id = %s WHERE id = %s;",
            (company_id, user_id),
        )
        return user_id, company_id

    # Não há usuários no sistema; não é possível provisionar automaticamente
    raise RuntimeError(
        "Nenhum usuário existente em public.users. Crie um usuário via Supabase Auth e reexecute."
    )


def seed_employees(cur, company_id, created_by):
    employees = [
        ("Ana Silva", "11122233344", "Rua A, 100"),
        ("Bruno Souza", "55566677788", "Rua B, 200"),
        ("Carla Lima", "99900011122", "Rua C, 300"),
    ]
    for name, cpf, addr in employees:
        cur.execute(
            "SELECT 1 FROM public.gf_employee_company WHERE cpf = %s;",
            (cpf,),
        )
        if cur.fetchone():
            continue
        cur.execute(
            """
            INSERT INTO public.gf_employee_company 
            (company_id, name, cpf, address, login_cpf, phone, email, is_active, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, %s);
            """,
            (
                company_id,
                name,
                cpf,
                addr,
                cpf,
                None,
                f"{name.split()[0].lower()}@example.com",
                created_by,
            ),
        )


def set_operator_session(cur, uid):
    claims = {"sub": str(uid), "role": "authenticated"}
    # Persistir claims na sessão inteira para chamadas subsequentes
    cur.execute("SET request.jwt.claims = %s;", (json.dumps(claims),))


def export_view(cur, view_name: str, out_dir: Path, limit: int = 1000):
    cur.execute(f"SELECT * FROM public.{view_name} LIMIT %s;", (limit,))
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{view_name}.csv"
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(cols)
        writer.writerows(rows)
    print(f"CSV exportado: {out_path}")


def test_rpcs(cur, empresa_id, uid):
    # rpc_request_service
    try:
        set_operator_session(cur, uid)
        cur.execute(
            "SELECT rpc_request_service(%s, %s, %s::jsonb);",
            (empresa_id, "nova_rota", json.dumps({"observacao": "teste"})),
        )
        req_id = cur.fetchone()[0]
        print("rpc_request_service OK:", req_id)
    except Exception as e:
        print("Erro rpc_request_service:", e)

    # rpc_request_route_change (se existir uma rota)
    cur.execute("SELECT id FROM public.routes WHERE company_id = %s LIMIT 1;", (empresa_id,))
    r = cur.fetchone()
    if r:
        route_id = r[0]
        try:
            set_operator_session(cur, uid)
            cur.execute(
                "SELECT rpc_request_route_change(%s, %s, %s::jsonb);",
                (empresa_id, route_id, json.dumps({"alteracao": "horario"})),
            )
            rid = cur.fetchone()[0]
            print("rpc_request_route_change OK:", rid)
        except Exception as e:
            print("Erro rpc_request_route_change:", e)
    else:
        print("Sem rotas para testar rpc_request_route_change.")


def verify_gf_service_requests_payload(cur):
    cur.execute(
        """
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'gf_service_requests'
            AND column_name = 'payload'
        );
        """
    )
    exists = cur.fetchone()[0]
    print("Tabela gf_service_requests possui coluna payload:", "SIM" if exists else "NÃO")


def main():
    conn = connect_db()
    cur = conn.cursor()
    try:
        uid, empresa_id = ensure_operator_user(cur)
        print("Operador:", uid, "Empresa:", empresa_id)

        seed_employees(cur, empresa_id, uid)
        print("Funcionários seed inseridos, se não existiam.")

        # Validar RLS via sessão simulada e exportar CSVs
        set_operator_session(cur, uid)
        reports_dir = ROOT / "database" / "reports"
        for view in [
            "v_operator_routes",
            "v_operator_employees",
            "v_operator_requests",
            "v_operator_dashboard_kpis",
        ]:
            export_view(cur, view, reports_dir)

        # Testar RPCs
        test_rpcs(cur, empresa_id, uid)
        verify_gf_service_requests_payload(cur)

        print("Todas as ações concluídas.")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
