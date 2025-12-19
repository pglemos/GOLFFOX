# Runbook: Backup e Restore - GolfFox

**Última atualização:** 2025-01-XX

---

## 📋 Visão Geral

Este runbook descreve como fazer backup e restore do banco de dados Supabase.

---

## 💾 Backup do Banco de Dados

### Método 1: Supabase Dashboard (Automático)

**Backups Automáticos:**
- Supabase faz backups automáticos diários
- Retidos por 7 dias (plano gratuito)
- Retidos por 30 dias (planos pagos)

**Acessar:**
1. Supabase Dashboard → Projeto
2. Settings → Database
3. Backups → Ver backups disponíveis

### Método 2: Backup Manual (pg_dump)

**Via Supabase CLI:**

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link projeto
supabase link --project-ref [project-ref]

# 4. Fazer backup
supabase db dump -f backup.sql
```

**Via pg_dump direto:**

```bash
# Obter connection string do Supabase Dashboard
# Settings → Database → Connection string

pg_dump "postgresql://[connection-string]" > backup.sql
```

### Método 3: Backup de Tabelas Específicas

```sql
-- Backup de tabela específica
COPY (SELECT * FROM table_name) TO '/tmp/backup.csv' WITH CSV HEADER;
```

---

## 🔄 Restore do Banco de Dados

### Restore Completo

**Via Supabase Dashboard:**

1. Acessar Backups
2. Selecionar backup desejado
3. Clicar em "Restore"
4. Confirmar restauração

**⚠️ ATENÇÃO:** Restore completo sobrescreve banco atual!

### Restore Parcial (Tabela Específica)

```sql
-- 1. Fazer backup da tabela atual (se necessário)
CREATE TABLE table_name_backup AS SELECT * FROM table_name;

-- 2. Restaurar dados
TRUNCATE table_name;
COPY table_name FROM '/tmp/backup.csv' WITH CSV HEADER;
```

### Restore via SQL

```bash
# Restaurar dump SQL
psql "postgresql://[connection-string]" < backup.sql
```

---

## 📅 Estratégia de Backup

### Backup Diário (Automático)

- Supabase faz automaticamente
- Não requer ação manual

### Backup Antes de Migrations

**Sempre fazer backup antes de:**
- Aplicar migrations destrutivas
- Alterar estrutura de tabelas críticas
- Deletar dados em massa

**Como:**
```bash
# Backup rápido antes de migration
supabase db dump -f backup-pre-migration-$(date +%Y%m%d).sql
```

### Backup de Dados Críticos

**Tabelas críticas para backup:**
- `users`
- `companies`
- `carriers`
- `vehicles`
- `routes`
- `gf_costs`
- `gf_budgets`

---

## 🔍 Verificar Integridade do Backup

### Verificar Tamanho

```bash
# Verificar que backup não está vazio
ls -lh backup.sql
```

### Verificar Conteúdo

```bash
# Verificar que contém dados
grep -c "INSERT INTO" backup.sql
```

### Testar Restore (Ambiente de Teste)

1. Criar projeto de teste no Supabase
2. Restaurar backup
3. Verificar que dados estão corretos

---

## 🗂️ Backup de Storage (Arquivos)

### Supabase Storage

**Backup Manual:**

1. Supabase Dashboard → Storage
2. Selecionar bucket
3. Download manual de arquivos importantes

**Via API (Futuro):**
```typescript
// Script para backup de storage
// Implementar se necessário
```

---

## 📊 Backup de Configurações

### Variáveis de Ambiente

**Backup:**
- Documentar todas as variáveis
- Salvar em local seguro (1Password, etc.)
- Não commitar no Git

### RLS Policies

**Backup:**
```sql
-- Exportar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

### Functions e Triggers

**Backup:**
```sql
-- Exportar funções
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Exportar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## ⚠️ Procedimentos de Emergência

### Banco Corrompido

1. **Identificar Problema**
   - Verificar logs do Supabase
   - Identificar tabela/query problemática

2. **Restaurar Backup Mais Recente**
   - Via Supabase Dashboard
   - Ou via CLI

3. **Verificar Integridade**
   - Testar funcionalidades críticas
   - Verificar dados importantes

### Perda de Dados

1. **Identificar Escopo**
   - Quais tabelas afetadas?
   - Quando aconteceu?

2. **Restaurar Backup**
   - Usar backup anterior ao problema
   - Restaurar apenas tabelas afetadas (se possível)

3. **Recuperar Dados Perdidos**
   - Verificar se há logs/auditoria
   - Recriar dados se necessário

---

## 🔐 Segurança de Backups

### Armazenamento

- **Local:** Criptografado
- **Cloud:** Supabase (já criptografado)
- **Acesso:** Apenas pessoal autorizado

### Retenção

- **Backups Automáticos:** 7-30 dias (depende do plano)
- **Backups Manuais:** Manter por 90 dias
- **Backups Críticos:** Manter por 1 ano

---

## 📝 Checklist de Backup

### Antes de Operações Críticas

- [ ] Backup completo do banco
- [ ] Backup de tabelas específicas afetadas
- [ ] Backup de configurações (RLS, functions)
- [ ] Verificar que backup foi criado com sucesso

### Após Restore

- [ ] Verificar que dados foram restaurados
- [ ] Testar funcionalidades críticas
- [ ] Verificar integridade referencial
- [ ] Notificar equipe se necessário

---

**Última atualização:** 2025-01-XX
