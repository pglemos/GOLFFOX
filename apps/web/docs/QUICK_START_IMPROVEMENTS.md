# Guia Rápido - Melhorias Implementadas

## 🚀 Como Usar as Novas Funcionalidades

### 1. Camada de Serviço

Use os serviços para lógica de negócio em vez de acessar o banco diretamente nas rotas API:

```typescript
import { CompanyService } from '@/lib/services'

// Em uma rota API
const companies = await CompanyService.listCompanies({ 
  isActive: true, 
  limit: 10 
})
```

### 2. Respostas API Padronizadas

Use os helpers para respostas consistentes:

```typescript
import { successResponse, errorResponse } from '@/lib/api-response'

// Sucesso
return successResponse(data, 200, { message: 'Operação realizada com sucesso' })

// Erro
return errorResponse(error, 500, 'Erro ao processar requisição')
```

### 3. Sistema de i18n

Use traduções nos componentes:

```typescript
import { translate } from '@/lib/i18n'

// Com locale padrão (detectado automaticamente)
const text = translate('common.save')

// Com locale específico
const text = translate('common.save', 'en-US')
```

### 4. Monitoramento

Registre métricas e faça health checks:

```typescript
import { monitoring, measureTime } from '@/lib/monitoring'

// Registrar métrica
monitoring.recordMetric('api.request.duration', 150, 'ms', { route: '/api/users' })

// Medir tempo de execução
const result = await measureTime('fetchUsers', async () => {
  return await fetchUsers()
})

// Health check
const health = await monitoring.performHealthCheck()
```

### 5. Auditoria de Segurança

Execute a auditoria de segurança das rotas API:

```bash
npm run audit:security
```

Isso gerará um relatório em `api-security-audit.json` com:
- Rotas auditadas
- Rotas desprotegidas
- Avisos de segurança

### 6. Health Check

Verifique o status da aplicação:

```bash
npm run health:check
```

Ou acesse diretamente: `http://localhost:3000/api/health`

## 📋 Checklist de Migração

Se você está migrando código antigo:

- [ ] Substituir acesso direto ao Supabase por serviços
- [ ] Usar `successResponse` e `errorResponse` em rotas API
- [ ] Substituir strings hardcoded por `translate()`
- [ ] Adicionar `requireAuth` em rotas que não têm
- [ ] Adicionar rate limiting em rotas sensíveis
- [ ] Registrar métricas em operações importantes

## 🔒 Segurança

### Rotas Protegidas

Todas as rotas `/api/admin/*` devem usar:

```typescript
const authErrorResponse = await requireAuth(request, 'admin')
if (authErrorResponse) {
  return authErrorResponse
}
```

### Rotas Sensíveis

Rotas que modificam dados críticos devem ter rate limiting:

```typescript
import { withRateLimit } from '@/lib/rate-limit'

export const POST = withRateLimit(handler, 'sensitive')
```

### Rotas Perigosas

Rotas que executam SQL ou modificam schema devem ter validação adicional:

```typescript
if (process.env.NODE_ENV === 'production') {
  const adminSecret = request.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
}
```

## 📚 Documentação Adicional

- `docs/SECURITY_AUDIT_REPORT.md` - Relatório completo de segurança
- `docs/EXECUTION_SUMMARY.md` - Resumo detalhado das melhorias
- `docs/CHANGELOG_IMPROVEMENTS.md` - Changelog completo

