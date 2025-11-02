-- ========================================
-- GOLFFOX v7.4 — Criar perfis a partir de auth.users (schema-safe)
-- Usa apenas colunas existentes; lida com role NOT NULL e ENUM
-- ========================================

DO $$
DECLARE
  -- flags de existência das colunas em public.users
  has_email   boolean;
  has_name    boolean;
  has_role    boolean;
  has_company boolean;
  has_carrier boolean;

  -- info de role
  role_is_enum boolean := false;
  role_udt     text    := null;
  role_enum_first text := null;

  -- laço dos perfis
  rec RECORD;

  -- dados vindos do auth
  v_auth_id    uuid;
  v_auth_email text;

  -- valores por perfil
  v_company uuid := '11111111-1111-4111-8111-1111111111c1';
  v_carrier uuid := '22222222-2222-4222-8222-2222222222ca';

  -- valores calculados
  i_email   text;
  i_name    text;
  i_role    text;
  i_company uuid;
  i_carrier uuid;

  -- SQL dinâmico
  sql_cols text;
  sql_vals text;
  sql_ins  text;
BEGIN
  -- 1) Descobre colunas existentes
  SELECT
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='email'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='name'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='company_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='carrier_id')
  INTO has_email, has_name, has_role, has_company, has_carrier;

  -- 2) Se role existe, checa se é ENUM e pega 1º valor como fallback
  IF has_role THEN
    SELECT (data_type='USER-DEFINED'), udt_name
      INTO role_is_enum, role_udt
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='role';

    IF role_is_enum THEN
      SELECT e.enumlabel
      INTO role_enum_first
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid=t.oid
      WHERE t.typname=role_udt
      ORDER BY e.enumsortorder
      LIMIT 1;
    END IF;
  END IF;

  -- 3) Perfis que queremos criar/alinhar
  FOR rec IN
    SELECT * FROM (
      VALUES
        ('admin',     ARRAY['admin@trans.com','admin@empresa.com']::text[],               'Administrador',  'admin',     v_company, NULL::uuid),
        ('operator',  ARRAY['operador@trans.com','operador@empresa.com']::text[],         'Operador',       'operator',  v_company, NULL::uuid),
        ('carrier',   ARRAY['transportadora@trans.com','transportadora@empresa.com']::text[],'Transportadora','carrier',  NULL::uuid, v_carrier),
        ('driver',    ARRAY['motorista@trans.com','motorista@empresa.com']::text[],       'Motorista',      'driver',    NULL::uuid, v_carrier),
        ('passenger', ARRAY['passageiro@trans.com','passageiro@empresa.com']::text[],     'Passageiro',     'passenger', v_company, NULL::uuid)
    ) AS t(kind, emails, full_name, role_name, company_id, carrier_id)
  LOOP
    -- 3.1) Busca id+email em auth.users
    SELECT id, email INTO v_auth_id, v_auth_email
    FROM auth.users
    WHERE email = ANY (rec.emails)
    LIMIT 1;

    IF v_auth_id IS NULL THEN
      RAISE NOTICE '⚠️ % não encontrado em auth.users (%).', rec.kind, rec.emails;
      CONTINUE;
    END IF;

    -- 3.2) Monta os valores conforme colunas e tipos
    i_email := CASE WHEN has_email THEN v_auth_email ELSE NULL END;
    i_name  := CASE WHEN has_name  THEN rec.full_name ELSE NULL END;

    IF has_role THEN
      IF role_is_enum THEN
        -- usa o label se existir no ENUM; senão cai no 1º valor do ENUM
        SELECT COALESCE(
                 (SELECT rec.role_name
                  WHERE EXISTS (
                    SELECT 1
                    FROM pg_type t
                    JOIN pg_enum e ON e.enumtypid=t.oid
                    WHERE t.typname=role_udt AND e.enumlabel=rec.role_name
                  )),
                 role_enum_first
               )
        INTO i_role;
      ELSE
        i_role := rec.role_name;
      END IF;
    END IF;

    i_company := CASE WHEN has_company THEN rec.company_id ELSE NULL END;
    i_carrier := CASE WHEN has_carrier THEN rec.carrier_id ELSE NULL END;

    -- 3.3) INSERT dinâmico incluindo só o que existe (evita NOT NULL)
    sql_cols := 'id';
    sql_vals := quote_literal(v_auth_id) || '::uuid';

    IF has_email THEN
      sql_cols := sql_cols || ', email';
      sql_vals := sql_vals || ', ' || quote_nullable(i_email);
    END IF;

    IF has_name THEN
      sql_cols := sql_cols || ', name';
      sql_vals := sql_vals || ', ' || quote_nullable(i_name);
    END IF;

    IF has_role THEN
      sql_cols := sql_cols || ', role';
      IF role_is_enum THEN
        sql_vals := sql_vals || ', ' || format('%L::%I.%I', i_role, 'public', role_udt);
      ELSE
        sql_vals := sql_vals || ', ' || quote_nullable(i_role);
      END IF;
    END IF;

    IF has_company THEN
      sql_cols := sql_cols || ', company_id';
      IF i_company IS NULL THEN
        sql_vals := sql_vals || ', NULL';
      ELSE
        sql_vals := sql_vals || ', ' || quote_literal(i_company) || '::uuid';
      END IF;
    END IF;

    IF has_carrier THEN
      sql_cols := sql_cols || ', carrier_id';
      IF i_carrier IS NULL THEN
        sql_vals := sql_vals || ', NULL';
      ELSE
        sql_vals := sql_vals || ', ' || quote_literal(i_carrier) || '::uuid';
      END IF;
    END IF;

    sql_ins := format('INSERT INTO public.users (%s) VALUES (%s) ON CONFLICT DO NOTHING;', sql_cols, sql_vals);
    EXECUTE sql_ins;

    -- 3.4) Updates idempotentes para alinhar (se existirem as colunas)
    IF has_email THEN
      UPDATE public.users SET email = v_auth_email WHERE id = v_auth_id;
    END IF;

    IF has_role THEN
      IF role_is_enum THEN
        EXECUTE format('UPDATE public.users SET role = %L::%I.%I WHERE id = %L',
                       i_role, 'public', role_udt, v_auth_id::text);
      ELSE
        UPDATE public.users SET role = i_role WHERE id = v_auth_id;
      END IF;
    END IF;

    IF has_company AND i_company IS NOT NULL THEN
      UPDATE public.users SET company_id = i_company WHERE id = v_auth_id AND company_id IS DISTINCT FROM i_company;
    END IF;

    IF has_carrier AND i_carrier IS NOT NULL THEN
      UPDATE public.users SET carrier_id = i_carrier WHERE id = v_auth_id AND carrier_id IS DISTINCT FROM i_carrier;
    END IF;

    IF has_name THEN
      UPDATE public.users SET name = COALESCE(name, i_name) WHERE id = v_auth_id;
    END IF;

    RAISE NOTICE '✅ Perfil % vinculado a public.users: %', rec.kind, v_auth_id;
  END LOOP;
END$$;

-- Resumo final
SELECT COUNT(*) AS total_em_public_users FROM public.users;
