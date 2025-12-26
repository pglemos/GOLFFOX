# Documentação de Rotas Perigosas - GolfFox

## Visão Geral

O sistema GolfFox possui rotas especiais para operações administrativas de banco de dados que são consideradas "perigosas" devido ao seu potencial de causar danos se mal utilizadas.

Essas rotas possuem múltiplas camadas de proteção.

## Lista de Rotas Perigosas

### 1. `/api/admin/execute-sql-fix`
- **Propósito**: Executar correções SQL no banco de dados
- **Método**: POST
- **Proteções**: 
  - Autenticação admin obrigatória
  - Rate limiting (sensitive)
  - Validação SQL
  - Auditoria completa
  - Secret adicional em produção

### 2. `/api/admin/fix-database`
- **Propósito**: Aplicar correções estruturais no banco
- **Método**: POST
- **Proteções**:
  - Autenticação admin obrigatória
  - Rate limiting (sensitive)
  - Validação SQL
  - Auditoria completa
  - Secret adicional em produção

## Camadas de Proteção

### 1. Autenticação Admin
Todas as rotas perigosas requerem autenticação de usuário com role `admin`.

```typescript
const authErrorResponse = await requireAuth(request, 'admin')
if (authErrorResponse) return authErrorResponse
```

### 2. Rate Limiting
Limita o número de requisições para prevenir abuso:
- Tipo: `sensitive` (10 requests por minuto)
- Tipo: `database` (3 requests por minuto)

```typescript
export const POST = withRateLimit(handler, 'sensitive')
```

### 3. Secret Adicional em Produção
Em ambiente de produção, é necessário um header adicional:

```bash
curl -X POST 'https://example.com/api/admin/execute-sql-fix' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'x-admin-secret: SEU_SECRET' \
  -d '{"sql": "..."}'
```

Configure a variável de ambiente:
```
ADMIN_SECRET=seu_secret_seguro_aqui
```

### 4. Validação SQL
Todas as queries são validadas contra:

**Comandos Bloqueados (Blacklist):**
- DROP TABLE
- DROP DATABASE
- DROP SCHEMA
- TRUNCATE
- DELETE FROM (sem WHERE)
- EXEC / EXECUTE

**Padrões Perigosos Detectados:**
- SQL injection patterns
- Múltiplos statements suspeitos
- Queries muito grandes

**Comandos Permitidos (Whitelist):**
- ALTER TABLE
- CREATE OR REPLACE FUNCTION
- CREATE TRIGGER
- UPDATE, SELECT, INSERT
- CREATE INDEX

### 5. Auditoria Obrigatória
Toda operação é registrada na tabela `gf_audit_log`:

```typescript
const handlerWithAudit = withDangerousRouteAudit(
  handler,
  'action_name',
  'resource_type'
)
```

**Dados Registrados:**
- ID do usuário
- Ação executada
- Tipo de recurso
- Detalhes (mascarados para segurança)
- IP e User-Agent
- Timestamp
- Resultado da operação

## Como Usar

### 1. Configurar Secret (Produção)
```bash
# .env.production
ADMIN_SECRET=gerar_secret_seguro_aqui
```

### 2. Fazer Requisição
```javascript
const response = await fetch('/api/admin/execute-sql-fix', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-admin-secret': process.env.ADMIN_SECRET,
  },
  body: JSON.stringify({
    sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS new_column TEXT;'
  })
})
```

### 3. Verificar Logs de Auditoria
```sql
SELECT * FROM gf_audit_log 
WHERE action_type LIKE 'execute_sql%'
ORDER BY created_at DESC
LIMIT 10;
```

## Fluxo de Segurança

```
Requisição
    │
    ▼
Rate Limiting ────► 429 (Too Many Requests)
    │
    ▼
Autenticação Admin ────► 401/403 (Não Autorizado)
    │
    ▼
Secret Produção ────► 403 (Acesso Negado)
    │
    ▼
Auditoria (ANTES) ────► 500 (Falha na Auditoria = Bloqueio)
    │
    ▼
Validação SQL ────► 400 (SQL Inválido)
    │
    ▼
Execução
    │
    ▼
Auditoria (RESULTADO)
    │
    ▼
Resposta
```

## Monitoramento e Alertas

### Verificar Tentativas de Acesso
```sql
SELECT * FROM gf_audit_log
WHERE action_type LIKE '%dangerous%'
OR action_type LIKE 'execute_sql%'
ORDER BY created_at DESC;
```

### Alertas Recomendados
Configure alertas para:
1. Múltiplas tentativas de autenticação falhadas
2. Rate limit excedido
3. Tentativas de SQL injection
4. Acessos fora do horário normal

## Boas Práticas

1. **Nunca compartilhe o ADMIN_SECRET**
2. **Sempre teste SQL em ambiente de desenvolvimento primeiro**
3. **Revise logs de auditoria regularmente**
4. **Mantenha backups antes de operações destrutivas**
5. **Use o princípio do menor privilégio**

## Referências
- `lib/middleware/dangerous-route-audit.ts` - Middleware de auditoria
- `lib/validation/sql-validator.ts` - Validador SQL
- `lib/rate-limit.ts` - Rate limiting
- `lib/api-auth.ts` - Autenticação
