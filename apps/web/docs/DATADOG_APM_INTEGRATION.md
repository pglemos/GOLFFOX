# Integração Datadog APM - GolfFox

**Data:** 2025-01-27  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 Resumo

Integração com Datadog APM (Application Performance Monitoring) para monitoramento de performance, rastreamento de erros e métricas em tempo real.

---

## ✅ O Que Foi Implementado

### 1. SDK Instalado
- ✅ `dd-trace` - SDK oficial do Datadog para Node.js/Next.js

### 2. Configuração
- ✅ `lib/apm/datadog.ts` - Módulo de integração com Datadog
- ✅ `instrumentation.ts` - Hook de inicialização do Next.js
- ✅ `next.config.js` - Habilitado `instrumentationHook`

### 3. Integração com Sistema Existente
- ✅ `lib/metrics/metrics-collector.ts` - Integrado com Datadog
- ✅ Métricas automáticas enviadas para Datadog em produção

---

## 🔧 Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente:

```bash
# Nome do serviço no Datadog
DATADOG_SERVICE_NAME=golffox-web

# Ambiente (development, staging, production)
DATADOG_ENV=production

# Versão da aplicação
DATADOG_VERSION=1.0.0

# Habilitar/desabilitar tracing
DD_TRACE_ENABLED=true

# Host do agente Datadog (opcional - para agent local)
DD_AGENT_HOST=localhost

# Porta do agente (opcional)
DD_TRACE_AGENT_PORT=8126

# Taxa de sampling (0.0 a 1.0, default: 1.0 = 100%)
DD_TRACE_SAMPLE_RATE=1.0
```

### Para Vercel

No dashboard da Vercel, adicione as variáveis de ambiente acima.

**Nota:** Para Vercel, o Datadog Agent não é necessário. O SDK se conecta diretamente à API do Datadog usando a API Key.

---

## 📊 Funcionalidades

### 1. Tracing Automático

O Datadog rastreia automaticamente:
- ✅ Requisições HTTP (Next.js API Routes)
- ✅ Queries ao Supabase
- ✅ Operações de banco de dados
- ✅ Chamadas externas (APIs)

### 2. Métricas Customizadas

```typescript
import { metricsCollector } from '@/lib/metrics/metrics-collector'

// Registrar contador
metricsCollector.increment('api.requests', 1, { route: '/api/users' })

// Registrar gauge
metricsCollector.gauge('cache.size', 150, { type: 'redis' })

// Registrar histograma (tempo de execução)
metricsCollector.histogram('api.response.duration', 250, { route: '/api/users' })
```

### 3. Spans Customizados

```typescript
import { createSpan, addSpanTags } from '@/lib/apm/datadog'

// Criar span customizado
await createSpan('custom.operation', 'process-data', async (span) => {
  // Seu código aqui
  addSpanTags({ userId: '123', action: 'update' })
  // ...
})
```

### 4. Registro de Erros

```typescript
import { recordError } from '@/lib/apm/datadog'

try {
  // código
} catch (error) {
  recordError(error, { userId: '123', action: 'update' })
  throw error
}
```

---

## 📈 Dashboards Recomendados

### 1. Performance Dashboard

**Métricas:**
- `http.request.duration` - Tempo de resposta das APIs
- `http.request.count` - Número de requisições
- `http.request.error_rate` - Taxa de erro

**Filtros:**
- Por rota (`route:/api/users`)
- Por método HTTP (`method:POST`)
- Por status code (`status:200`)

### 2. Database Dashboard

**Métricas:**
- `supabase.query.duration` - Tempo de query
- `supabase.query.count` - Número de queries
- `supabase.query.error_rate` - Taxa de erro

### 3. Business Metrics Dashboard

**Métricas Customizadas:**
- `trips.created` - Viagens criadas
- `vehicles.active` - Veículos ativos
- `alerts.critical` - Alertas críticos

---

## 🚨 Alertas Recomendados

### 1. Alta Taxa de Erro

**Condição:** `http.request.error_rate > 0.1` (10%)  
**Severidade:** Critical  
**Ação:** Notificar equipe via Slack/Email

### 2. Tempo de Resposta Lento

**Condição:** `http.request.duration.p95 > 3000ms`  
**Severidade:** Warning  
**Ação:** Investigar performance

### 3. Erro Crítico no Banco

**Condição:** `supabase.query.error_rate > 0.05` (5%)  
**Severidade:** Critical  
**Ação:** Verificar conexão e queries

---

## 🔍 Como Usar

### Em Produção

1. Configure as variáveis de ambiente no Vercel
2. O Datadog iniciará automaticamente quando a aplicação iniciar
3. Métricas e traces aparecerão no dashboard do Datadog

### Em Desenvolvimento

Por padrão, o Datadog está desabilitado em desenvolvimento. Para habilitar:

```bash
DD_TRACE_ENABLED=true npm run dev
```

---

## 📝 Notas Importantes

1. **Performance:** O Datadog adiciona overhead mínimo (< 1ms por requisição)
2. **Sampling:** Em produção, considere reduzir `DD_TRACE_SAMPLE_RATE` para 0.1 (10%) para reduzir custos
3. **Health Checks:** Health checks (`/api/health`) não são rastreados para evitar poluição de métricas
4. **Privacidade:** Dados sensíveis (senhas, tokens) não são automaticamente rastreados

---

## 🔗 Links Úteis

- [Datadog Next.js Integration](https://docs.datadoghq.com/serverless/nextjs/)
- [Datadog APM Documentation](https://docs.datadoghq.com/tracing/)
- [Datadog Metrics API](https://docs.datadoghq.com/api/latest/metrics/)

---

**Última atualização:** 2025-01-27

