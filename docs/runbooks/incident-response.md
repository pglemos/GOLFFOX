# Runbook de Resposta a Incidentes

## Objetivo

Procedimentos padronizados para responder a incidentes no sistema GolfFox, garantindo recuperação rápida e aprendizado contínuo.

## Níveis de Severidade

### P0 - Crítico (Page On-Call)
- **Critérios:**
  - Sistema completamente indisponível
  - Perda de dados ou corrupção de dados
  - Violação de segurança (vazamento de dados, acesso não autorizado)
- **Tempo de Resposta:** Imediato (< 15 minutos)
- **Tempo de Resolução:** < 1 hora

### P1 - Alto
- **Critérios:**
  - Degradação significativa de performance (> 50% das requisições falhando)
  - Funcionalidade crítica indisponível (ex: login, pagamentos)
  - Erros recorrentes em produção
- **Tempo de Resposta:** < 1 hora
- **Tempo de Resolução:** < 4 horas

### P2 - Médio
- **Critérios:**
  - Funcionalidade parcialmente indisponível
  - Performance degradada mas sistema funcional
  - Problemas em features não-críticas
- **Tempo de Resposta:** < 4 horas
- **Tempo de Resolução:** < 1 dia útil

### P3 - Baixo
- **Critérios:**
  - Problemas cosméticos ou menores
  - Melhorias sugeridas
  - Bugs não-bloqueantes
- **Tempo de Resposta:** < 1 dia útil
- **Tempo de Resolução:** < 1 semana

## Fluxo de Resposta

### 1. Detecção e Classificação

1. **Identificar fonte do incidente:**
   - Alertas do sistema (Sentry, Vercel, Supabase)
   - Relatos de usuários
   - Monitoramento proativo

2. **Classificar severidade:**
   - Usar critérios acima
   - Quando em dúvida, classificar mais alto

3. **Comunicar:**
   - P0/P1: Acionar equipe imediatamente (Slack/Email)
   - P2/P3: Criar ticket e tratar no horário comercial

### 2. Triagem e Investigação

1. **Coletar informações:**
   ```bash
   # Verificar logs Vercel
   vercel logs --follow
   
   # Verificar status Supabase
   # Acessar Supabase Dashboard → Logs
   
   # Verificar health check
   curl https://golffox.vercel.app/api/health
   ```

2. **Identificar escopo:**
   - Quantos usuários afetados?
   - Qual funcionalidade específica?
   - Desde quando o problema ocorre?

3. **Acessar recursos:**
   - Vercel Dashboard: https://vercel.com/dashboard
   - Supabase Dashboard: https://supabase.com/dashboard
   - GitHub: https://github.com/[org]/golffox

### 3. Resolução

#### Incidentes de Disponibilidade

1. **Verificar saúde dos serviços:**
   ```bash
   # Health check
   curl https://golffox.vercel.app/api/health
   ```

2. **Verificar logs de erro:**
   - Vercel: Dashboard → Deployments → Logs
   - Supabase: Dashboard → Logs → Postgres Logs

3. **Ações comuns:**
   - **Rate limit atingido:** Verificar Upstash Redis, aumentar limites se necessário
   - **Erro de banco:** Verificar conexões, pool size, queries lentas
   - **Build falhando:** Verificar erros de compilação, dependências

#### Incidentes de Performance

1. **Identificar gargalo:**
   ```sql
   -- Verificar queries lentas no Supabase
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Soluções comuns:**
   - Adicionar índices ausentes
   - Otimizar queries N+1
   - Limpar cache se necessário
   - Escalar recursos (Vercel Pro, Supabase)

#### Incidentes de Segurança

1. **Isolar:**
   - Desabilitar funcionalidade afetada se possível
   - Revogar tokens/credenciais comprometidos
   - Analisar logs para identificar origem

2. **Mitigar:**
   - Aplicar patch de segurança
   - Alterar secrets/chaves
   - Notificar usuários afetados (se necessário)

3. **Documentar:**
   - Registrar incidente
   - Criar plano de prevenção

### 4. Comunicação

#### Durante o Incidente

- **P0/P1:** Atualizações a cada 30 minutos (Slack/Email)
- **P2/P3:** Atualizar quando houver progresso significativo

#### Após Resolução

1. **Post-mortem (obrigatório para P0/P1):**
   - O que aconteceu?
   - O que foi feito?
   - Como prevenir no futuro?
   - Ações de follow-up

2. **Comunicar usuários (se aplicável):**
   - E-mail para usuários afetados
   - Atualização de status (se houver página pública)

## SLIs e SLOs

### Service Level Indicators (SLIs)

- **Uptime:** `(total_requests - 5xx_errors) / total_requests`
- **Latência API:** p95 latency < 500ms
- **Taxa de erro:** `5xx_errors / total_requests < 0.1%`

### Service Level Objectives (SLOs)

- **Uptime:** 99.9% (máximo 43 minutos de downtime/mês)
- **Latência API:** p95 < 500ms para 99% das requisições
- **Taxa de erro:** < 0.1% (99.9% de sucesso)

### Alertas

- **Uptime < 99.5%:** P1 - Investigar
- **Uptime < 99%:** P0 - Acionar equipe
- **Latência p95 > 1s:** P1 - Investigar
- **Taxa de erro > 1%:** P1 - Investigar
- **Taxa de erro > 5%:** P0 - Acionar equipe

## Recursos e Contatos

### Dashboards
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard
- Upstash Redis: https://console.upstash.com

### Documentação
- Arquitetura: `docs/ARCHITECTURE.md`
- Troubleshooting: `docs/runbooks/troubleshooting.md`
- Deployment: `docs/deployment/`

### Contatos de Emergência
- Equipe de desenvolvimento: [definir]
- Suporte Supabase: support@supabase.com
- Suporte Vercel: [via dashboard]

## Checklist Pós-Incidente

- [ ] Problema resolvido e verificado
- [ ] Usuários comunicados (se aplicável)
- [ ] Logs coletados e analisados
- [ ] Post-mortem criado (P0/P1)
- [ ] Ações de prevenção definidas
- [ ] Documentação atualizada
- [ ] Métricas monitoradas por 24h
