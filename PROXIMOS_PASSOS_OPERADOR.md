# Próximos Passos - Painel do Operador

## ✅ Implementação Completa

Todas as páginas, migrações, views, RPCs e RLS foram criadas e publicadas na Vercel.

## 📋 Ações Manuais Necessárias

### 1. Aplicar Migrações no Supabase (SQL Editor)

Execute na ordem:

1. `database/migrations/gf_operator_tables.sql`
2. `database/migrations/gf_operator_views.sql`
3. `database/migrations/gf_operator_rpcs.sql`
4. `database/migrations/gf_operator_rls.sql`

**Importante:** Após aplicar RLS, teste com um usuário operador se ele consegue ler suas próprias tabelas.

### 2. Seed de Dados Demo (Opcional)

1. Abra `database/seeds/operator_demo_seed.sql`
2. Substitua os placeholders:
   - `:empresa_id` → UUID da empresa do operador
   - `:carrier_id` → UUID de uma transportadora disponível
   - `:route_id_1`, `:route_id_2`, `:route_id_3` → IDs de rotas reais (ou comente linhas que dependem delas)
3. Execute no SQL Editor do Supabase

### 3. Verificar Variáveis de Ambiente na Vercel

No projeto Vercel → Settings → Environment Variables, confirme:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- ✅ `SUPABASE_SERVICE_ROLE` (apenas server-side)

### 4. Testar Health-Check Localmente

```bash
cd web-app
npx ts-node scripts/health-check-operator.ts
```

Deve retornar ✅ para as views criadas.

### 5. Validar Páginas em Produção

Acesse https://golffox.vercel.app/operator e navegue:

- ✅ Dashboard (KPIs e Torre de Controle)
- ✅ `/operator/rotas` → `/operator/rotas/mapa?route_id=...`
- ✅ `/operator/prestadores` (read-only)
- ✅ `/operator/solicitacoes` (kanban)
- ✅ `/operator/custos`
- ✅ `/operator/relatorios`
- ✅ `/operator/conformidade`
- ✅ `/operator/comunicacoes`
- ✅ `/operator/preferencias`

### 6. Verificar RLS Funcionando

Execute como usuário operador (company_id conhecido):

```sql
-- Deve retornar apenas dados da empresa do operador
SELECT * FROM v_operator_dashboard_kpis WHERE empresa_id = :empresa_id;
SELECT * FROM gf_service_requests WHERE empresa_id = :empresa_id;
SELECT * FROM v_operator_assigned_carriers WHERE empresa_id = :empresa_id;

-- Não deve retornar dados de outras empresas
SELECT * FROM gf_service_requests WHERE empresa_id != :empresa_id; -- Deve estar vazio ou erro
```

## 🔍 Troubleshooting

### Erro: "View não existe"
→ Execute as migrações de views (`gf_operator_views.sql`)

### Erro: "Permission denied"
→ Execute as migrações de RLS (`gf_operator_rls.sql`) e verifique que o usuário tem `role = 'operator'` e `company_id` correto

### Erro: "Page 404" em `/operador`
→ Já corrigido com redirect no `next.config.js`. Aguarde deploy da Vercel.

### Dados não aparecem nas telas
→ Verifique que:
1. As views foram criadas
2. Os dados de seed foram inseridos (ou insira manualmente)
3. O usuário logado tem `company_id` correspondente aos dados

## 📚 Documentação

- `docs/README-OPERATOR.md` - Guia do operador
- `docs/AUDITORIA_MOBILE_v42.md` - Auditoria mobile
- `docs/DEPLOY_VERCEL.md` - Deploy e configuração

## ✅ Checklist Final

- [ ] Migrações aplicadas no Supabase
- [ ] RLS testado (usuário operador vê apenas seus dados)
- [ ] Seed executado (opcional, para dados demo)
- [ ] Health-check passou localmente
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Páginas testadas em produção
- [ ] Redirecionamento `/operador` → `/operator` funcionando

## 🎯 Pronto!

Após completar os passos acima, o painel do operador está 100% funcional.

