# Checklist de Produção

Checklist pré-deploy e pós-deploy para garantir qualidade e estabilidade em produção.

## Pré-Deploy

### Código

- [ ] Todos os testes passando (`npm test`)
- [ ] Type check sem erros (`npm run type-check`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Build bem-sucedido (`npm run build`)
- [ ] Sem `console.log` em código de produção (exceto error handlers)
- [ ] Variáveis de ambiente documentadas e configuradas
- [ ] Secrets não commitados no código
- [ ] Migrations testadas localmente

### Segurança

- [ ] Rotas públicas têm rate limiting
- [ ] Rotas protegidas têm autenticação válida
- [ ] Webhooks têm validação de assinatura
- [ ] Sem endpoints de debug em produção (test-session, seed-admin, etc.)
- [ ] CORS configurado corretamente
- [ ] CSP headers configurados
- [ ] Rate limits configurados adequadamente

### Banco de Dados

- [ ] Migrations aplicadas no ambiente de staging
- [ ] RLS policies testadas
- [ ] Backups configurados
- [ ] Índices otimizados
- [ ] Queries lentas identificadas e otimizadas

### Performance

- [ ] Bundle size verificado (< 250KB inicial recomendado)
- [ ] Imagens otimizadas
- [ ] Cache configurado (Redis/Next.js cache)
- [ ] Queries otimizadas (sem N+1)
- [ ] Materialized views atualizadas (se aplicável)

### Monitoramento

- [ ] Health check funcionando (`/api/health`)
- [ ] Logs estruturados implementados
- [ ] Métricas configuradas (Web Vitals, error tracking)
- [ ] Alertas configurados (uptime, errors, latency)

## Deploy

### Processo

1. [ ] Criar branch a partir de `main`
2. [ ] Fazer alterações e commits
3. [ ] Abrir Pull Request
4. [ ] CI passa (lint, tests, build)
5. [ ] Code review aprovado
6. [ ] Merge para `main`
7. [ ] Deploy automático via Vercel

### Verificações Pós-Deploy

- [ ] Deploy bem-sucedido no Vercel
- [ ] Health check retorna 200: `curl https://golffox.vercel.app/api/health`
- [ ] Login funcionando
- [ ] Funcionalidades críticas testadas
- [ ] Sem erros nos logs (primeiros 5 minutos)
- [ ] Performance dentro do esperado (Web Vitals)

## Pós-Deploy (Primeiras 24h)

### Monitoramento Intensivo

- [ ] Verificar logs a cada hora (primeiras 4 horas)
- [ ] Monitorar métricas de performance
- [ ] Verificar taxa de erro (< 0.1%)
- [ ] Monitorar latência (p95 < 500ms)
- [ ] Verificar uso de recursos (Supabase, Vercel)

### Validações Funcionais

- [ ] Login/logout funcionando
- [ ] Criação de empresas/transportadoras
- [ ] Criação de rotas e viagens
- [ ] Dashboard carregando corretamente
- [ ] Mapas renderizando
- [ ] Relatórios gerando
- [ ] Notificações enviando

## Checklist Semanal

### Segunda-feira

- [ ] Revisar métricas da semana anterior
- [ ] Verificar backups
- [ ] Revisar logs de erro
- [ ] Atualizar dependências (se necessário)

### Quinta-feira

- [ ] Revisar performance (queries lentas)
- [ ] Verificar uso de recursos
- [ ] Planejar melhorias

## Checklist Mensal

- [ ] Revisar SLOs (Service Level Objectives)
- [ ] Análise de custos (Vercel, Supabase, Upstash)
- [ ] Revisar e atualizar documentação
- [ ] Atualizar dependências principais
- [ ] Revisar políticas de segurança
- [ ] Análise de métricas de negócio

## Rollback

Se necessário fazer rollback:

1. [ ] Identificar commit estável anterior
2. [ ] Reverter no Vercel: Dashboard → Deployments → ... → Redeploy
3. [ ] Reverter migrations (se aplicável): `supabase migration down`
4. [ ] Verificar sistema após rollback
5. [ ] Documentar motivo do rollback
6. [ ] Criar issue para investigar problema

## Contatos de Emergência

- **Vercel:** Dashboard → Support
- **Supabase:** support@supabase.com
- **Equipe:** [definir contatos]

## Links Úteis

- Health Check: https://golffox.vercel.app/api/health
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub: [definir URL]
