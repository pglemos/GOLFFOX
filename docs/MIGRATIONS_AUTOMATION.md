# Automação de Migrations - GolfFox

**Última atualização:** 2025-01-16

---

## 🎯 Objetivo

Sistema 100% autônomo para gerenciar migrations do banco de dados Supabase.

---

## 📦 Scripts Criados

### 1. `scripts/check-migrations-status.js`

**Função:** Verificar status de todas as migrations

**Uso:**
```bash
node scripts/check-migrations-status.js
```

**Saída:**
- Lista todas as migrations encontradas
- Indica quais foram aplicadas
- Verifica tabelas importantes no banco
- Gera relatório completo

---

### 2. `scripts/apply-migrations.js`

**Função:** Aplicar migrations pendentes

**Uso:**
```bash
node scripts/apply-migrations.js
```

**Funcionalidades:**
- Lista migrations em ordem
- Verifica se já foram aplicadas
- Gera instruções para aplicação manual
- Registra migrations aplicadas

**Nota:** Supabase não permite execução direta de SQL via API por segurança. O script gera instruções detalhadas.

---

### 3. `scripts/generate-migration-instructions.js`

**Função:** Gerar arquivo markdown com instruções completas

**Uso:**
```bash
node scripts/generate-migration-instructions.js
```

**Saída:**
- Arquivo `docs/MIGRATION_INSTRUCTIONS.md` com todas as migrations
- Instruções passo a passo
- Código SQL pronto para copiar/colar

---

### 4. `scripts/verify-migration.sql`

**Função:** Script SQL para verificação pós-migration

**Uso:**
- Copiar conteúdo
- Executar no Supabase SQL Editor

**Verifica:**
- Tabelas criadas
- Índices
- RLS policies
- Contagem de registros
- Views materializadas

---

## 🚀 Workflow Completo

### Passo 1: Verificar Status

```bash
npm run migrations:status
# ou
node scripts/check-migrations-status.js
```

### Passo 2: Gerar Instruções

```bash
node scripts/generate-migration-instructions.js
```

Isso cria `docs/MIGRATION_INSTRUCTIONS.md` com todas as migrations prontas.

### Passo 3: Aplicar Migrations

**Opção A: Supabase Dashboard (Recomendado)**
1. Abrir `docs/MIGRATION_INSTRUCTIONS.md`
2. Copiar SQL de cada migration
3. Colar no Supabase SQL Editor
4. Executar

**Opção B: Supabase CLI**
```bash
supabase db push
```

### Passo 4: Verificar

```bash
npm run migrations:status
```

Ou executar `scripts/verify-migration.sql` no SQL Editor.

---

## 📋 Migrations Pendentes

### ⏳ `20250115_event_store.sql`
- **Tabela:** `gf_event_store`
- **Propósito:** Event Sourcing para auditoria
- **Status:** Pendente

### ⏳ `20250116_missing_tables.sql`
- **Tabelas:** 
  - `gf_web_vitals`
  - `gf_operational_alerts`
  - `gf_audit_log`
  - `driver_positions`
  - `gf_vehicle_checklists`
- **Status:** Pendente

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env.local ou .env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### NPM Scripts (Root)

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "migrations:status": "node scripts/check-migrations-status.js",
    "migrations:apply": "node scripts/apply-migrations.js",
    "migrations:instructions": "node scripts/generate-migration-instructions.js"
  }
}
```

---

## ✅ Checklist de Aplicação

- [ ] Verificar variáveis de ambiente configuradas
- [ ] Executar `npm run migrations:status`
- [ ] Gerar instruções: `npm run migrations:instructions`
- [ ] Aplicar migrations pendentes
- [ ] Verificar com `scripts/verify-migration.sql`
- [ ] Testar funcionalidades que usam as novas tabelas
- [ ] Monitorar logs de erro

---

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"
- Verificar `.env` ou `.env.local`
- Garantir que `SUPABASE_SERVICE_ROLE_KEY` está configurado

### Erro: "Cannot read directory"
- Verificar que `supabase/migrations/` existe
- Verificar permissões de leitura

### Migration já aplicada
- Scripts verificam automaticamente
- Migrations usam `IF NOT EXISTS` (idempotentes)

---

## 📝 Próximos Passos

1. ✅ Aplicar `20250115_event_store.sql`
2. ✅ Aplicar `20250116_missing_tables.sql`
3. ✅ Verificar status final
4. ✅ Testar funcionalidades
5. ✅ Documentar resultados

---

**Status:** ✅ Sistema de automação completo e pronto para uso
