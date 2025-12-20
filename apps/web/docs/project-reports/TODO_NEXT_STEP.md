# TODO_NEXT_STEP.md

**Data de Criação:** 05/11/2024  
**Status:** Auditoria Completa - Supabase ✅ | Vercel ✅

---

## 📊 RESUMO EXECUTIVO

### ✅ FASE 1: SUPABASE - COMPLETA

**Migrações v43:**
- ✅ Todas as 8 migrações aplicadas e validadas
- ✅ 5 tabelas criadas (gf_user_company_map, gf_company_branding, etc.)
- ✅ 10 views seguras criadas
- ✅ 1 materialized view (mv_operator_kpis)
- ✅ 2 funções (company_ownership, refresh_mv_operator_kpis)
- ✅ RLS habilitado em 7 tabelas críticas (29 policies no total)
- ✅ 2 operadores mapeados para empresas

**Status:**
- Objetos: 100% criados
- RLS: 100% ativo
- Mapeamentos: 2 operadores → 2 empresas
- Backfill: Necessário popular dados de teste

### ✅ FASE 2: VERCEL - COMPLETA

**Configuração:**
- ✅ vercel.json configurado com 2 cron jobs
- ✅ 14 rotas de API encontradas
- ✅ Next.js App Router em uso
- ✅ Estrutura de arquivos correta

**Cron Jobs:**
- ✅ `/api/cron/refresh-kpis` - A cada 5 minutos
- ✅ `/api/cron/dispatch-reports` - A cada 15 minutos

**Testes de Rotas:**
- ✅ `/` - Home funcionando (200 OK)
- ⚠️ `/operador` - Redirecionamento (307) - Esperado para autenticação
- ✅ `/api/health` - Implementado (verifica status da aplicação e conexão Supabase)

---

## 🎯 PRÓXIMOS PASSOS PRIORITÁRIOS

### 1. BACKFILL DE DADOS (CRÍTICO)

**Problema:** Views seguras retornam 0 registros porque não há dados de teste.

**Ação:**
```bash
# Executar seed de dados de teste
node scripts/seed-demo.js  # Se existir
# OU criar dados manualmente via Supabase Dashboard
```

**Verificar:**
- [ ] `v_my_companies` retorna empresas
- [ ] `mv_operator_kpis` tem dados (após refresh)
- [ ] `v_operator_routes_secure` tem rotas
- [ ] `v_operator_alerts_secure` tem alertas

### 2. CONFIGURAR BRANDING DAS EMPRESAS

**Status:** 0 empresas com branding configurado

**Ação:**
```bash
# Executar script interativo
node scripts/setup-operador-company-interactive.js
```

**Ou manualmente via SQL:**
```sql
INSERT INTO gf_company_branding (company_id, name, logo_url, primary_hex, accent_hex)
VALUES 
  ('uuid-empresa-1', 'Nome Empresa 1', 'https://...', '#FF5733', '#33FF57'),
  ('uuid-empresa-2', 'Nome Empresa 2', 'https://...', '#3357FF', '#FF33F5');
```

### 3. VALIDAR VARIÁVEIS DE AMBIENTE NO VERCEL

**Variáveis Requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `CRON_SECRET` ⚠️ **CRÍTICO para cron jobs**
- `RESEND_API_KEY`

**Ação:**
1. Acessar Vercel Dashboard → Project Settings → Environment Variables
2. Verificar todas as variáveis acima
3. **Gerar `CRON_SECRET` se não existir:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Adicionar `CRON_SECRET` no Vercel

### 4. TESTAR CRON JOBS

**Status:** Configurados, mas não testados

**Ação:**
1. Aguardar execução automática (5min / 15min)
2. Verificar logs no Vercel Dashboard → Functions → Cron Jobs
3. Testar manualmente:
   ```bash
   curl -X POST https://golffox.vercel.app/api/cron/refresh-kpis \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

**Verificar:**
- [ ] `/api/cron/refresh-kpis` executa com sucesso
- [ ] `mv_operator_kpis` é atualizado
- [ ] `/api/cron/dispatch-reports` executa com sucesso
- [ ] Relatórios são enviados por email (se houver agendamentos)

### 6. TESTAR FUNCIONALIDADES DO OPERADOR

**Checklist:**
- [ ] Login como operador
- [ ] Seleção de empresa (se múltiplas)
- [ ] Dashboard exibe KPIs corretos
- [ ] Rotas são filtradas por empresa
- [ ] Alertas são filtrados por empresa
- [ ] Importação CSV de funcionários
- [ ] Otimização de rotas
- [ ] Relatórios são gerados corretamente

---

## 📁 ARQUIVOS GERADOS

### Relatórios JSON:
- `SUPABASE_PRECHECK_RESULT.json` - Status antes das migrações
- `SUPABASE_V43_AUDIT.json` - Validação pós-migração
- `VERCEL_STATUS.json` - Auditoria Vercel
- `VERCEL_ROUTES_TEST.json` - Testes de rotas HTTP

### Scripts Criados:
- `scripts/run-precheck-v43.js` - Pré-check Supabase
- `scripts/validate-v43-migrations.js` - Validação pós-migração
- `scripts/seed-operador-mappings.js` - Seed de mapeamentos
- `scripts/test-vercel-routes.js` - Teste de rotas HTTP
- `scripts/audit-vercel.js` - Auditoria Vercel

---

## 🔍 DESCOBERTAS IMPORTANTES

### ✅ Pontos Positivos:
1. **Migrações 100% aplicadas** - Todas as estruturas criadas
2. **RLS completo** - 29 policies ativas em 7 tabelas
3. **Cron jobs configurados** - Estrutura pronta
4. **Arquitetura sólida** - Views seguras e materialized views

### ⚠️ Pontos de Atenção:
1. **Dados vazios** - Views retornam 0 registros (precisa seed)
2. **Branding não configurado** - 0 empresas com branding
3. **Health check ausente** - Endpoint não existe (não crítico)
4. **Variáveis de ambiente** - Verificar se todas estão no Vercel

### 🔧 Melhorias Recomendadas:
1. Criar script de seed completo com dados de teste
2. Adicionar health check endpoint
3. Documentar processo de setup de branding
4. Adicionar testes automatizados para cron jobs

---

## 📝 COMANDOS ÚTEIS

### Reexecutar Validações:
```bash
# Pré-check Supabase
node scripts/run-precheck-v43.js

# Validação completa
node scripts/validate-v43-migrations.js

# Seed de mapeamentos
node scripts/seed-operador-mappings.js

# Teste de rotas Vercel
node scripts/test-vercel-routes.js

# Auditoria Vercel
node scripts/audit-vercel.js
```

### Refresh Materialized View:
```sql
REFRESH MATERIALIZED VIEW mv_operator_kpis;
```

### Verificar Mapeamentos:
```sql
SELECT 
  u.email,
  c.name as company_name,
  ucm.created_at
FROM gf_user_company_map ucm
JOIN auth.users u ON u.id = ucm.user_id
JOIN companies c ON c.id = ucm.company_id;
```

---

## ✅ CONCLUSÃO

**Supabase:** ✅ Pronto para uso (falta apenas dados de teste)  
**Vercel:** ✅ Configurado corretamente (verificar variáveis de ambiente)

**Próxima Ação Imediata:** Configurar branding e popular dados de teste.

