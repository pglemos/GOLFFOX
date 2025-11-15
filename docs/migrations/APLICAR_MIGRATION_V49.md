# 🚀 Aplicar Migration v49 no Supabase

**Migration:** `v49_protect_user_company_map.sql`  
**Objetivo:** Adicionar RLS em `gf_user_company_map` para prevenir escalação de privilégios  
**Severidade:** **ALTA** - Risco de segurança

---

## 📋 Método 1: Via Supabase Dashboard (Recomendado)

### Passo 1: Acessar SQL Editor
1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto GOLFFOX
3. Vá em **SQL Editor** no menu lateral

### Passo 2: Copiar e Executar SQL
1. Abra o arquivo: `database/migrations/v49_protect_user_company_map.sql`
2. Copie **todo o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 3: Verificar Aplicação
Execute esta query para verificar se as políticas foram criadas:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'gf_user_company_map';
```

**Resultado esperado:**
- `user_select_own_companies` (SELECT)
- `admin_manage_user_companies` (ALL)

---

## 📋 Método 2: Via Script Node.js

### Pré-requisitos
```bash
cd web-app
npm install dotenv
```

### Executar Script
```bash
# Configurar variáveis de ambiente
export NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# Executar script
node scripts/apply-v49-migration.js
```

**Nota:** O script pode não funcionar se o Supabase não tiver RPC `exec_sql`. Nesse caso, use o Método 1.

---

## 📋 Método 3: Via Supabase CLI

### Instalar CLI (se não tiver)
```bash
npm install -g supabase
```

### Aplicar Migration
```bash
# Login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref seu-project-ref

# Aplicar migration
supabase db push database/migrations/v49_protect_user_company_map.sql
```

---

## ✅ Validação Pós-Aplicação

### Teste 1: Verificar RLS Habilitado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'gf_user_company_map';
-- rowsecurity deve ser 'true'
```

### Teste 2: Tentar Inserir como Operador (deve falhar)
```sql
-- Como operador (não admin)
SET request.jwt.claims.sub = '<operator_user_id>';
INSERT INTO gf_user_company_map (user_id, company_id, created_at)
VALUES (auth.uid(), '<another_company_id>', NOW());
-- Esperado: Erro "new row violates row-level security policy"
```

### Teste 3: Verificar SELECT (deve funcionar)
```sql
-- Como operador
SET request.jwt.claims.sub = '<operator_user_id>';
SELECT * FROM gf_user_company_map WHERE user_id = auth.uid();
-- Esperado: Retorna apenas mapeamentos do próprio usuário
```

---

## 🔍 SQL da Migration

```sql
-- Migration: v49_protect_user_company_map
-- Data: 2025-01-07
-- Descrição: Adicionar RLS em gf_user_company_map para prevenir auto-adição de usuários a empresas

ALTER TABLE IF EXISTS public.gf_user_company_map ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuário vê apenas seus próprios mapeamentos
DROP POLICY IF EXISTS user_select_own_companies ON public.gf_user_company_map;
CREATE POLICY user_select_own_companies ON public.gf_user_company_map
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: Apenas admin pode modificar
DROP POLICY IF EXISTS admin_manage_user_companies ON public.gf_user_company_map;
CREATE POLICY admin_manage_user_companies ON public.gf_user_company_map
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY user_select_own_companies ON public.gf_user_company_map IS 
  'RLS: Usuário pode ver apenas seus próprios mapeamentos empresa-usuário';

COMMENT ON POLICY admin_manage_user_companies ON public.gf_user_company_map IS 
  'RLS: Apenas admin pode modificar user-company mappings para prevenir escalation de privilégios';

-- Garantir que a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gf_user_company_map'
  ) THEN
    RAISE EXCEPTION 'Tabela gf_user_company_map não existe. Execute migrations v43 primeiro.';
  END IF;
END $$;
```

---

## ⚠️ Troubleshooting

### Erro: "Tabela gf_user_company_map não existe"
**Solução:** Execute primeiro a migration `v43_gf_user_company_map.sql`

### Erro: "Policy already exists"
**Solução:** As políticas já existem. Execute `DROP POLICY IF EXISTS` antes de criar.

### Erro: "Permission denied"
**Solução:** Certifique-se de estar usando a **Service Role Key** (não a Anon Key)

---

## 📊 Status da Aplicação

- [ ] Migration aplicada no Supabase
- [ ] RLS habilitado na tabela
- [ ] Políticas criadas (2 políticas)
- [ ] Testes de validação executados
- [ ] Documentação atualizada

---

**Próximo passo:** Após aplicar a migration, testar o sistema para garantir que operadores não conseguem adicionar-se a outras empresas.

