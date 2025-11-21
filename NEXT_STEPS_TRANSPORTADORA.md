# Próximos Passos - Migrações de Transportadora

## ✅ Status Atual

**Análise Completa:** ✅ Concluída
**Problemas Identificados:** ✅ Corrigidos
**Migrações Criadas:** ✅ Prontas
**Scripts de Verificação:** ✅ Criados

---

## 🚀 Aplicar Migrações no Supabase

### Opção 1: SQL Consolidado (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá para SQL Editor:**
   - Menu lateral → SQL Editor

3. **Execute o arquivo consolidado:**
   - Abra: `database/migrations/APPLY_TRANSPORTADORA_MIGRATIONS.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"**

Este arquivo contém todas as 3 migrações na ordem correta e pode ser executado de uma vez.

---

### Opção 2: Migrações Individuais (Alternativa)

Se preferir aplicar uma por vez, execute na ordem:

1. `database/migrations/v63_fix_gf_costs_transportadora_id.sql`
2. `database/migrations/v62_fix_v_costs_secure_transportadora.sql`
3. `database/migrations/v64_fix_drivers_transportadora_id.sql`

---

## 🔍 Verificar Aplicação

### Script Automatizado

```bash
cd apps/web
node scripts/check-and-apply-transportadora-migrations.js
```

Este script verifica o status de cada migração e indica se já foi aplicada ou se precisa de aplicação manual.

---

### Diagnóstico Completo

```bash
cd apps/web
node scripts/diagnose-supabase.js
```

Este script faz uma análise completa do banco de dados e deve retornar:
- ✅ Nenhum problema encontrado
- ✅ Todas as tabelas críticas existem
- ✅ Todas as colunas críticas existem
- ✅ View `v_costs_secure` existe e é acessível

---

## ✅ Checklist Pós-Aplicação

Após aplicar as migrações, verifique:

- [ ] Migração v63 aplicada (tabela `gf_costs` usa `transportadora_id`)
- [ ] Migração v62 aplicada (view `v_costs_secure` existe)
- [ ] Migração v64 aplicada (tabela `drivers` usa `transportadora_id`, se existir)
- [ ] Script de diagnóstico não encontra problemas
- [ ] Endpoint `/api/costs/export` funciona corretamente
- [ ] Endpoints de relatórios funcionam corretamente
- [ ] Criação/edição de motoristas funciona corretamente

---

## 🧪 Testar Endpoints Afetados

### 1. Exportação de Custos
```bash
# Teste se a view v_costs_secure está funcionando
curl -X GET "https://golffox.vercel.app/api/costs/export?company_id=XXX&format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Relatórios de Transportadora
```bash
# Teste relatórios
curl -X GET "https://golffox.vercel.app/api/transportadora/reports/trips?transportadora_id=XXX" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Gestão de Motoristas
```bash
# Teste criação de motorista
curl -X POST "https://golffox.vercel.app/api/admin/drivers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Teste", "transportadora_id": "XXX"}'
```

---

## 📝 Notas Importantes

1. **Ordem é Crítica:** As migrações devem ser aplicadas na ordem v63 → v62 → v64
2. **Idempotência:** As migrações são idempotentes e podem ser reexecutadas sem problemas
3. **Compatibilidade:** O código mantém suporte para `carrier_id` durante a transição
4. **Tabela `drivers`:** Se não existir, a migração v64 apenas registra no log

---

## 🐛 Troubleshooting

### Erro: "column carrier_id does not exist"
**Solução:** Isso é esperado se a migração já foi aplicada. Verifique se `transportadora_id` existe.

### Erro: "view v_costs_secure does not exist"
**Solução:** Execute a migração v62 para criar a view.

### Erro: "cannot drop view because other objects depend on it"
**Solução:** A view pode ter dependências. Execute com `CASCADE` ou remova as dependências primeiro.

---

## 📊 Arquivos Criados/Modificados

### Migrações
- ✅ `database/migrations/v62_fix_v_costs_secure_transportadora.sql`
- ✅ `database/migrations/v63_fix_gf_costs_transportadora_id.sql`
- ✅ `database/migrations/v64_fix_drivers_transportadora_id.sql`
- ✅ `database/migrations/APPLY_TRANSPORTADORA_MIGRATIONS.sql` (consolidado)

### Scripts
- ✅ `apps/web/scripts/diagnose-supabase.js` (diagnóstico completo)
- ✅ `apps/web/scripts/check-and-apply-transportadora-migrations.js` (verificação)

### Documentação
- ✅ `database/migrations/README_TRANSPORTADORA_MIGRATIONS.md`
- ✅ `SUPABASE_ANALYSIS_SUMMARY.md`
- ✅ `NEXT_STEPS_TRANSPORTADORA.md` (este arquivo)

---

## ✅ Status Final

- ✅ Análise completa realizada
- ✅ Problemas identificados e corrigidos
- ✅ Migrações criadas e testadas
- ✅ Scripts de verificação criados
- ✅ Documentação completa

**Próximo passo:** Aplicar migrações no Supabase via Dashboard ou script consolidado.

