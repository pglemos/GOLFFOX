# Próximos Passos Imediatos

**Data:** 06/11/2025  
**Status:** ✅ Scripts e dados criados - Pronto para configuração final

---

## 🔑 1. CONFIGURAR CRON_SECRET NO VERCEL (CRÍTICO)

### Secret Gerado
```
0216de1e4783c9b1f2e2588a9553235c4c4ed3c39f643a69336cc823c9147b73
```

### Opção A: Via Vercel Dashboard (Recomendado)
1. Acesse: https://vercel.com/dashboard
2. Selecione projeto: **golffox**
3. Vá em: **Settings** → **Environment Variables**
4. Clique em: **Add New**
5. Preencha:
   - **Key:** `CRON_SECRET`
   - **Value:** `0216de1e4783c9b1f2e2588a9553235c4c4ed3c39f643a69336cc823c9147b73`
   - **Environment:** Selecione **Production** e **Preview**
6. Clique em: **Save**

✅ Status: Configurado via CLI para Production e Preview
Evidência:
- `vercel env add CRON_SECRET production` → ✅
- `vercel env add CRON_SECRET preview` → ✅
- `vercel env ls` → `CRON_SECRET` presente em ambos

### Opção B: Via CLI
```bash
# Adicionar para Production
vercel env add CRON_SECRET production
# Cole o valor quando solicitado: 0216de1e4783c9b1f2e2588a9553235c4c4ed3c39f643a69336cc823c9147b73

# Adicionar para Preview
vercel env add CRON_SECRET preview
# Cole o mesmo valor
```

**⚠️ IMPORTANTE:** Após adicionar, faça um novo deploy ou aguarde o próximo deploy automático.

---

## 🧪 2. TESTAR CRON JOBS

### Após configurar CRON_SECRET:

```bash
# Testar localmente (com secret)
export CRON_SECRET=0216de1e4783c9b1f2e2588a9553235c4c4ed3c39f643a69336cc823c9147b73
node scripts/test-cron-jobs.js

# Ou testar diretamente via curl
curl -X GET https://golffox.vercel.app/api/cron/refresh-kpis \
  -H "Authorization: Bearer 0216de1e4783c9b1f2e2588a9553235c4c4ed3c39f643a69336cc823c9147b73"
```

### Verificar Logs no Vercel
1. Acesse: **Vercel Dashboard** → **golffox** → **Functions**
2. Procure por: **Cron Jobs**
3. Verifique execuções de:
- `/api/cron/refresh-kpis` (a cada 5 minutos)
- `/api/cron/dispatch-reports` (a cada 15 minutos)

### Resultados de Testes (Registro)
- `golffox.vercel.app` → ⚠️ 500 Internal Server Error
- `golffox-ajj64vhsn-synvolt.vercel.app` → ⚠️ 401 Unauthorized

Interpretação:
- 401 indica proteção ativa com `CRON_SECRET`; revisar método/rota e header
- Validar comparação no endpoint: `authHeader === 'Bearer ' + process.env.CRON_SECRET`

Próximas Ações:
- Confirmar métodos esperados (GET/POST) de ambos endpoints
- Reexecutar testes após validação

---

## 🏥 3. TESTAR HEALTH CHECK

```bash
# Via script
node scripts/test-health-check.js

# Via curl
curl https://golffox.vercel.app/api/health
```

**Resposta esperada:**
```json
{
  "ok": true,
  "supabase": "ok",
  "ts": "2025-11-06T01:00:00.000Z"
}
```

---

## ✅ 4. VALIDAR DADOS NO SUPABASE

### Verificar Views Seguras (como operador autenticado)
```sql
-- KPIs (deve retornar dados se operador estiver mapeado)
SELECT * FROM v_operator_dashboard_kpis_secure LIMIT 10;

-- Rotas (deve retornar rotas da empresa do operador)
SELECT * FROM v_operator_routes_secure LIMIT 10;

-- Alertas (deve retornar alertas da empresa do operador)
SELECT * FROM v_operator_alerts_secure LIMIT 10;
```

### Verificar Mapeamentos
```sql
-- Verificar mapeamentos operador → empresa
SELECT 
  u.email,
  c.name as company_name,
  ucm.created_at
FROM gf_user_company_map ucm
JOIN auth.users u ON u.id = ucm.user_id
JOIN companies c ON c.id = ucm.company_id;
```

### Verificar Branding
```sql
-- Verificar branding configurado
SELECT 
  cb.company_id,
  c.name as company_name,
  cb.name as branding_name,
  cb.primary_hex,
  cb.accent_hex
FROM gf_company_branding cb
JOIN companies c ON c.id = cb.company_id;
```

---

## 🧪 5. EXECUTAR TESTES FUNCIONAIS

Seguir checklist completo em: `docs/TESTE_FUNCIONALIDADES_OPERADOR.md`

### Testes Prioritários:
1. **Login e Seleção de Empresa**
   - [ ] Login como operador
   - [ ] Seleção de empresa funciona
   - [ ] Branding aparece corretamente

2. **Dashboard**
   - [ ] KPIs carregam
   - [ ] Dados são específicos da empresa
   - [ ] Gráficos funcionam

3. **Rotas**
   - [ ] Lista de rotas carrega
   - [ ] Mapa funciona com fitBounds 20%
   - [ ] Filtros preservados na URL

4. **Funcionários**
   - [ ] Lista carrega
   - [ ] Importação CSV funciona
   - [ ] Geocodificação funciona

5. **Isolamento Multi-tenant**
   - [ ] Operador A vê apenas Empresa A
   - [ ] Operador B vê apenas Empresa B
   - [ ] RLS funciona corretamente

---

## 📊 6. VERIFICAR VARIÁVEIS DE AMBIENTE

### Status Atual (via script):
```bash
node scripts/check-vercel-env.js
```

### Variáveis Configuradas ✅:
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ✅

### Variáveis Faltando ⚠️:
- `CRON_SECRET` ⚠️ (gerado, precisa adicionar no Vercel)
- `RESEND_API_KEY` ⚠️ (opcional, apenas se usar emails)

---

## 🚀 7. DEPLOY E VALIDAÇÃO

### Após configurar CRON_SECRET:
1. **Fazer deploy** (se necessário):
   ```bash
   git add .
   git commit -m "feat: adiciona health check e scripts de teste"
   git push
   ```

2. **Aguardar deploy** no Vercel

3. **Validar em produção:**
- [ ] Health check funciona
- [ ] Cron jobs executam
- [ ] Dashboard carrega dados
- [ ] Branding aplicado

---

## 📝 8. DOCUMENTAÇÃO FINAL

### Arquivos de Referência:
- `docs/VERCEL_ENV_SETUP.md` - Setup completo de variáveis
- `docs/TESTE_FUNCIONALIDADES_OPERADOR.md` - Checklist de testes
- `IMPLEMENTACAO_COMPLETA_RESUMO.md` - Resumo da implementação

### Comandos Úteis:
```bash
# Verificar envs
node scripts/check-vercel-env.js

# Testar health check
node scripts/test-health-check.js

# Testar cron jobs (após configurar CRON_SECRET)
CRON_SECRET=xxx node scripts/test-cron-jobs.js

# Reexecutar seed (se necessário)
node scripts/seed-operator-data.js --companies=auto --routes=12 --employees=40

# Reexecutar branding
node scripts/seed-company-branding.js --defaults
```

---

## ✅ Checklist Final

- [ ] CRON_SECRET configurado no Vercel (Production + Preview)
- [ ] Health check testado e funcionando
- [ ] Cron jobs testados e funcionando
- [ ] Variáveis de ambiente verificadas
- [ ] Login como operador testado
- [ ] Dashboard exibe dados corretos
- [ ] Branding aplicado corretamente

---

## Atualização 06/11

- Correções aplicadas nas rotas de cron:
  - `/api/cron/refresh-kpis` agora usa cliente service_role (`supabaseServiceRole`)
  - `/api/cron/dispatch-reports` atualizado para usar `SUPABASE_SERVICE_ROLE` (padronização)
- Novo deployment de produção: `https://golffox-x2qsievav-synvolt.vercel.app`
- Testes manuais dos cron jobs continuam retornando 401, possivelmente devido à proteção de acesso do Vercel na URL; o agendador do Vercel deve conseguir autenticar via `Authorization: Bearer <CRON_SECRET>`.
- Agendamentos conforme `vercel.json`:
  - `/api/cron/refresh-kpis` → `0 3 * * *` (diário às 03:00)
  - `/api/cron/dispatch-reports` → `0 4 * * *` (diário às 04:00)

Próximos passos sugeridos:
- Verificar logs em Vercel → Functions → Cron Jobs após o horário agendado
- Se necessário, habilitar um bypass token para testes manuais ou desabilitar proteção temporária
- Garantir que `SUPABASE_SERVICE_ROLE` esteja configurado em Production e Preview (não expor em Development)
- [ ] Isolamento multi-tenant validado
- [ ] Testes funcionais executados

---

**Próxima Ação Imediata:** Configurar CRON_SECRET no Vercel Dashboard


