# Runbook: Monitoring - GolfFox

**Última atualização:** 2025-01-XX

---

## 📋 Visão Geral

Este runbook descreve como monitorar o sistema GolfFox em produção.

---

## 📊 Métricas Principais

### 1. Performance (Web Vitals)

**Onde:** Vercel Dashboard → Speed Insights

**Métricas:**
- **LCP (Largest Contentful Paint):** < 2.5s (bom)
- **FID (First Input Delay):** < 100ms (bom)
- **CLS (Cumulative Layout Shift):** < 0.1 (bom)

**Ações:**
- Verificar métricas semanalmente
- Investigar se alguma métrica degrada

### 2. Uptime

**Onde:** Vercel Dashboard → Analytics

**Verificar:**
- Disponibilidade do site
- Tempo de resposta médio
- Erros 5xx

### 3. Erros

**Onde:**
- Vercel Logs → Filtrar por erro
- Sentry (se configurado)

**Monitorar:**
- Taxa de erros
- Erros críticos (500, 503)
- Erros de autenticação

---

## 🔍 Logs

### Vercel Logs

**Acesso:**
1. Vercel Dashboard → Projeto
2. Deployments → Selecionar deployment
3. Functions → Ver logs

**Filtrar por:**
- Função/rota específica
- Nível (error, warn, info)
- Período de tempo

### Supabase Logs

**Acesso:**
1. Supabase Dashboard → Projeto
2. Logs → Selecionar tipo (Auth, API, Postgres)

**Monitorar:**
- Tentativas de login falhadas
- Queries lentas
- Erros de RLS

---

## 🚨 Alertas

### Configurar Alertas (Futuro)

**Métricas para Alertar:**
- Taxa de erro > 5%
- Uptime < 99%
- Tempo de resposta > 3s
- Erros críticos (500)

**Canais:**
- Email
- Slack
- PagerDuty (crítico)

---

## 📈 Dashboards

### Vercel Analytics

**Métricas Disponíveis:**
- Page views
- Unique visitors
- Top pages
- Referrers
- Countries

### Web Vitals

**Onde:** Vercel Dashboard → Speed Insights

**Visualizar:**
- Core Web Vitals ao longo do tempo
- Comparação com benchmarks
- Sugestões de melhoria

---

## 🔐 Segurança

### Monitorar

1. **Tentativas de Login Falhadas**
   - Supabase Logs → Auth
   - Verificar padrões suspeitos

2. **Rate Limiting**
   - Upstash Dashboard
   - Verificar se está funcionando

3. **Auditoria**
   - `gf_audit_log` table
   - Verificar operações perigosas

### Verificações Regulares

- [ ] Revisar logs de autenticação (semanal)
- [ ] Verificar tentativas suspeitas (diário)
- [ ] Revisar auditoria de rotas perigosas (diário)

---

## 💾 Banco de Dados

### Métricas do Supabase

**Acesso:** Supabase Dashboard → Database

**Monitorar:**
- Uso de storage
- Número de conexões
- Queries lentas
- Tamanho do banco

### Queries para Monitoramento

```sql
-- Tamanho do banco
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Tabelas maiores
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Conexões ativas
SELECT count(*) FROM pg_stat_activity;
```

---

## 🔄 Rotinas de Monitoramento

### Diário

- [ ] Verificar erros críticos (500, 503)
- [ ] Verificar tentativas de login suspeitas
- [ ] Verificar auditoria de rotas perigosas

### Semanal

- [ ] Revisar Web Vitals
- [ ] Revisar métricas de performance
- [ ] Revisar logs de erro
- [ ] Verificar uso de recursos (Supabase, Vercel)

### Mensal

- [ ] Revisar tendências de performance
- [ ] Analisar padrões de uso
- [ ] Planejar otimizações

---

## 🛠️ Ferramentas

### Atuais

- **Vercel Analytics** - Métricas de performance
- **Vercel Logs** - Logs de aplicação
- **Supabase Dashboard** - Métricas de banco
- **Upstash Dashboard** - Métricas de Redis

### Futuras (Opcional)

- **Sentry** - Error tracking detalhado
- **Datadog** - APM completo
- **New Relic** - Monitoramento avançado

---

## 📝 Relatórios

### Relatório Semanal

**Incluir:**
- Uptime
- Taxa de erro
- Web Vitals
- Top erros
- Ações tomadas

### Relatório Mensal

**Incluir:**
- Tendências de performance
- Crescimento de uso
- Problemas recorrentes
- Melhorias implementadas

---

**Última atualização:** 2025-01-XX
