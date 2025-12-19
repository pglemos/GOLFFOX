# Monitoramento e Observabilidade - GolfFox

**Última atualização:** 2025-01-XX

---

## 📊 Visão Geral

Sistema de monitoramento e observabilidade implementado para o GolfFox, incluindo métricas, health checks, alertas e integração com ferramentas externas.

---

## ✅ Implementado

### 1. Health Check API ✅

**Endpoint:** `GET /api/health`

**Funcionalidades:**
- Verificação de variáveis de ambiente
- Teste de conexão com Supabase
- Teste de conexão com Redis (se configurado)
- Status geral do sistema (healthy, degraded, unhealthy)

**Uso:**
```bash
curl https://golffox.vercel.app/api/health
```

**Resposta:**
```json
{
  "status": "healthy",
  "checks": {
    "environment": { "status": "ok", "message": "..." },
    "supabase": { "status": "ok", "message": "...", "latency": 45 },
    "redis": { "status": "ok", "message": "...", "latency": 12 }
  },
  "timestamp": "2025-01-XXT..."
}
```

### 2. Serviço de Monitoramento ✅

**Arquivo:** `lib/monitoring.ts`

**Funcionalidades:**
- Registro de métricas
- Health check básico
- Histórico de métricas (em memória)

**Uso:**
```typescript
import { monitoring } from '@/lib/monitoring'

monitoring.recordMetric('api.request.count', 1, 'count', { route: '/api/users' })
const health = await monitoring.performHealthCheck()
```

### 3. Coletor de Métricas ✅

**Arquivo:** `lib/metrics/metrics-collector.ts`

**Funcionalidades:**
- Contadores (`increment`)
- Gauges (`gauge`)
- Histogramas (`histogram`)
- Decorator para medir tempo de execução

**Uso:**
```typescript
import { metricsCollector, measureExecutionTime } from '@/lib/metrics/metrics-collector'

// Incrementar contador
metricsCollector.increment('api.requests', 1, { route: '/api/users' })

// Registrar gauge
metricsCollector.gauge('cache.size', 150, { type: 'redis' })

// Medir tempo de execução
const result = await measureExecutionTime('database.query', async () => {
  return await queryDatabase()
})
```

### 4. Gerenciador de Alertas ✅

**Arquivo:** `lib/alerts/alert-manager.ts`

**Funcionalidades:**
- Regras de alerta configuráveis
- Verificação de thresholds
- Cooldown entre alertas
- Persistência em `gf_operational_alerts`

**Uso:**
```typescript
import { alertManager } from '@/lib/alerts/alert-manager'

// Registrar regra
alertManager.registerRule({
  id: 'high-error-rate',
  name: 'Taxa de Erro Alta',
  metric: 'api.error.rate',
  threshold: 0.1,
  operator: 'gt',
  severity: 'error',
  enabled: true,
  cooldown: 300
})

// Verificar métrica
const alerts = await alertManager.checkMetric('api.error.rate', 0.15)
```

### 5. Web Vitals ✅

**Endpoint:** `POST /api/analytics/web-vitals`

**Funcionalidades:**
- Coleta de métricas Core Web Vitals (LCP, FID, CLS)
- Armazenamento em `gf_web_vitals`
- Geração automática de alertas para métricas "poor"

---

## 🔧 Integração com APM (Futuro)

### Datadog

```typescript
// Exemplo de integração (não implementado)
import { StatsD } from 'node-statsd'

const datadog = new StatsD({
  host: process.env.DATADOG_HOST,
  port: 8125
})

metricsCollector.increment('api.requests', 1)
datadog.increment('golffox.api.requests', 1, { route: '/api/users' })
```

### New Relic

```typescript
// Exemplo de integração (não implementado)
import newrelic from 'newrelic'

newrelic.recordMetric('Custom/API/Requests', 1)
newrelic.recordMetric('Custom/API/Duration', duration)
```

### Sentry

```typescript
// Já parcialmente implementado em lib/error-tracking.ts
import { trackError } from '@/lib/error-tracking'

trackError(error, { context: 'API', userId: user.id })
```

---

## 📈 Métricas Coletadas

### Métricas de API
- `api.requests` - Número de requisições
- `api.errors` - Número de erros
- `api.response.duration` - Tempo de resposta
- `api.error.rate` - Taxa de erro

### Métricas de Cache
- `cache.hits` - Cache hits
- `cache.misses` - Cache misses
- `cache.size` - Tamanho do cache

### Métricas de Banco
- `database.queries` - Número de queries
- `database.query.duration` - Tempo de query
- `database.connections` - Conexões ativas

### Métricas de Negócio
- `trips.created` - Viagens criadas
- `vehicles.active` - Veículos ativos
- `alerts.critical` - Alertas críticos

---

## 🚨 Alertas Configurados

### Regras Padrão

1. **Taxa de Erro Alta**
   - Métrica: `api.error.rate`
   - Threshold: > 10%
   - Severidade: `error`
   - Cooldown: 5 minutos

2. **Tempo de Resposta Lento**
   - Métrica: `api.response.duration`
   - Threshold: > 3 segundos
   - Severidade: `warning`
   - Cooldown: 10 minutos

---

## 📊 Dashboards (Futuro)

### Métricas Recomendadas

1. **Performance**
   - Tempo de resposta médio
   - P95, P99 de latência
   - Throughput (req/s)

2. **Erros**
   - Taxa de erro
   - Erros por tipo
   - Erros por rota

3. **Recursos**
   - Uso de CPU/Memória
   - Conexões de banco
   - Tamanho de cache

4. **Negócio**
   - Viagens por dia
   - Veículos ativos
   - Alertas críticos

---

## 🔍 Logging Estruturado

**Já implementado:** `lib/logger.ts`

**Níveis:**
- `debug` - Informações de debug
- `info` - Informações gerais
- `warn` - Avisos
- `error` - Erros

**Uso:**
```typescript
import { debug, warn, logError } from '@/lib/logger'

debug('Operação executada', { userId, action }, 'ComponentName')
warn('Aviso importante', { context }, 'ComponentName')
logError('Erro capturado', { error, context }, 'ComponentName')
```

---

## 📝 Próximos Passos

1. **Integrar APM** (Datadog, New Relic, etc.)
2. **Criar Dashboards** (Grafana, Datadog, etc.)
3. **Configurar Alertas Proativos** (Email, Slack, PagerDuty)
4. **Métricas de Negócio** (KPIs customizados)

---

**Última atualização:** 2025-01-XX
