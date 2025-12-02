-- Atualização sistemática de links do operador
-- Remove parâmetros `company` de URLs do operador e substitui o link antigo pelo correto
-- Fallback seguro: ignora colunas sem ocorrência

DO $$
DECLARE
    rec RECORD;
    tbl TEXT;
    col TEXT;
    sql TEXT;
    old_url CONSTANT TEXT := 'https://golffox.vercel.app/operator?company=11111111-1111-4111-8111-1111111111c1';
    new_url CONSTANT TEXT := 'https://golffox.vercel.app/operator';
BEGIN
  FOR rec IN
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE data_type IN ('character varying','text')
      AND table_schema NOT IN ('pg_catalog','information_schema')
  LOOP
    tbl := format('%I.%I', rec.table_schema, rec.table_name);
    col := format('%I', rec.column_name);

    -- 1) Substituição direta do link completo antigo
    sql := format('UPDATE %s SET %s = replace(%s, %L, %L) WHERE %s LIKE %L',
                  tbl, col, col, old_url, new_url, col, '%' || old_url || '%');
    EXECUTE sql;

    -- 2) Remoção de parâmetro company em qualquer URL absoluta do operador
    -- Ex.: https://golffox.vercel.app/operator?...&company=XYZ
    sql := format(
      $$UPDATE %s SET %s = regexp_replace(%s,
           '(https://golffox\.vercel\.app/operator[^\s]*?)((?:\?|&)+company=[^&\s]+)(&|$)',
           '\1\3',
           'gi')
         WHERE %s ~ '(https://golffox\.vercel\.app/operator[^\s]*?)(?:\?|&)+company='$$,
      tbl, col, col, col);
    EXECUTE sql;
  END LOOP;
END $$;

-- Para rollback, execute script inverso se necessário, ou restaure backup.
