# Procedimento de Rollback

Procedimento para reverter deploy em caso de problemas críticos em produção.

## Quando Fazer Rollback

- Sistema completamente indisponível após deploy
- Erros críticos afetando > 50% dos usuários
- Perda de dados ou corrupção
- Problema de segurança introduzido
- Performance degradada > 80%

## Rollback no Vercel

### Método 1: Redeploy de Deploy Anterior (Recomendado)

1. **Acessar Vercel Dashboard:**
   - Ir para: https://vercel.com/dashboard
   - Selecionar projeto `golffox`

2. **Localizar Deploy Estável:**
   - Ir em "Deployments"
   - Encontrar último deploy estável (antes do problema)
   - Verificar que o deploy tem status "Ready"

3. **Promover Deploy:**
   - Clicar nos três pontos (...) do deploy estável
   - Selecionar "Promote to Production"
   - Confirmar

4. **Verificar:**
   ```bash
   curl https://golffox.vercel.app/api/health
   ```

### Método 2: Reverter Git e Deploy

Se método 1 não funcionar:

1. **Reverter commit:**
   ```bash
   git checkout main
   git pull
   git revert <commit-hash-problematico>
   git push origin main
   ```

2. **Vercel fará deploy automático**
3. **Verificar saúde do sistema**

## Rollback de Migrations

Se o problema envolve migrations do banco:

### Verificar Estado Atual

```bash
# Listar migrations aplicadas
supabase migration list --db-url $DATABASE_URL

# Ou via Supabase Dashboard → Database → Migrations
```

### Reverter Migration Específica

1. **Criar migration de rollback:**
   ```sql
   -- Supabase Dashboard → SQL Editor
   -- Ou criar arquivo em supabase/migrations/YYYYMMDD_rollback_description.sql
   ```

2. **Aplicar rollback:**
   ```bash
   supabase migration up --db-url $DATABASE_URL
   ```

3. **Verificar estado do banco:**
   ```sql
   -- Verificar se rollback foi aplicado corretamente
   -- Verificar integridade dos dados
   ```

### Rollback Completo (Último Recurso)

⚠️ **CUIDADO:** Pode causar perda de dados

1. **Fazer backup completo:**
   ```bash
   # Via Supabase Dashboard → Database → Backups
   # Ou: pg_dump $DATABASE_URL > backup_before_rollback.sql
   ```

2. **Reverter para migration anterior:**
   ```bash
   supabase migration down --db-url $DATABASE_URL
   ```

3. **Verificar integridade:**
   - Testar funcionalidades críticas
   - Verificar dados importantes
   - Monitorar logs de erro

## Rollback de Variáveis de Ambiente

Se o problema for causado por variável de ambiente:

1. **Acessar Vercel Dashboard:**
   - Settings → Environment Variables

2. **Reverter valor:**
   - Alterar para valor anterior conhecido
   - Ou remover variável (se for nova)

3. **Redeploy:**
   - Vercel pode redeployar automaticamente
   - Ou forçar redeploy manual

## Verificação Pós-Rollback

### Imediato (< 5 minutos)

- [ ] Health check retorna 200
- [ ] Sem erros 500 nos logs
- [ ] Login funcionando
- [ ] Dashboard carregando

### Curto Prazo (< 1 hora)

- [ ] Funcionalidades críticas testadas
- [ ] Taxa de erro < 0.1%
- [ ] Latência normal (p95 < 500ms)
- [ ] Sem alertas de monitoramento

### Médio Prazo (24 horas)

- [ ] Sistema estável
- [ ] Métricas normalizadas
- [ ] Usuários não reportando problemas
- [ ] Post-mortem criado

## Comunicação

### Durante Rollback

1. **Notificar equipe:**
   - Slack/Email: "ROLLBACK EM ANDAMENTO - [descrição breve]"
   - Status: "Investigando problema, rollback iniciado"

2. **Após Rollback:**
   - Status: "Rollback concluído, sistema restaurado"
   - Informar próximos passos

### Após Rollback

1. **Post-mortem obrigatório:**
   - O que causou o problema?
   - Por que rollback foi necessário?
   - Como prevenir no futuro?

2. **Comunicar usuários (se aplicável):**
   - Problema temporário resolvido
   - Funcionalidades restauradas
   - Pedir desculpas se necessário

## Prevenção

Para evitar necessidade de rollback:

1. **Testes completos antes de merge**
2. **Deploy gradual (se possível):**
   - Staging primeiro
   - Preview deployments
   - Feature flags

3. **Monitoramento proativo:**
   - Alertas configurados
   - Dashboards atualizados
   - Logs monitorados

4. **Planos de rollback documentados:**
   - Para cada feature grande
   - Para migrations complexas
   - Para mudanças de infraestrutura

## Checklist de Rollback

- [ ] Problema identificado e classificado
- [ ] Decisão de rollback tomada
- [ ] Backup criado (se aplicável)
- [ ] Rollback executado
- [ ] Sistema verificado e funcionando
- [ ] Equipe comunicada
- [ ] Usuários comunicados (se necessário)
- [ ] Post-mortem agendado
- [ ] Prevenção documentada
