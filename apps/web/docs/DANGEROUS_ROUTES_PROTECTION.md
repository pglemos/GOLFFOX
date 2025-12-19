# Proteção de Rotas Perigosas - GolfFox

**Data:** 2025-01-XX  
**Status:** ✅ Implementado

---

## 📋 Resumo

Implementação de proteção obrigatória para rotas que executam operações perigosas no banco de dados:
- Auditoria obrigatória antes e depois da execução
- Validação de SQL antes de execução
- Rate limiting restritivo
- Logging completo de todas as operações

---

## ✅ O que foi Implementado

### 1. Validação de SQL ✅

**Arquivo:** `lib/validation/sql-validator.ts`

**Funcionalidades:**
- Whitelist de comandos permitidos (ALTER TABLE, CREATE FUNCTION, etc.)
- Blacklist de comandos perigosos (DROP TABLE, TRUNCATE, DELETE sem WHERE)
- Validação de padrões perigosos
- Sanitização de SQL (remove comentários, normaliza espaços)
- Warnings para SQL suspeito (múltiplas statements, tamanho excessivo)

**Uso:**
```typescript
import { validateSQLOrThrow } from '@/lib/validation/sql-validator'

const validatedSQL = validateSQLOrThrow(sql)
// Lança erro se SQL for inválido
```

### 2. Middleware de Auditoria Obrigatória ✅

**Arquivo:** `lib/middleware/dangerous-route-audit.ts`

**Funcionalidades:**
- Força auditoria ANTES de executar operação
- Bloqueia execução se auditoria falhar
- Registra resultado após execução
- Extrai contexto completo do usuário (ID, email, role, IP, User-Agent)
- Mascara dados sensíveis (email) nos logs

**Uso:**
```typescript
import { withDangerousRouteAudit } from '@/lib/middleware/dangerous-route-audit'

const handler = async (request: NextRequest, auditContext: AuditContext) => {
  // Operação perigosa aqui
}

export const POST = withDangerousRouteAudit(handler, 'action_name', 'resource_type')
```

### 3. Rotas Protegidas ✅

**Arquivos atualizados:**
- `app/api/admin/execute-sql-fix/route.ts`
- `app/api/admin/fix-database/route.ts`

**Proteções aplicadas:**
- ✅ Auditoria obrigatória antes da execução
- ✅ Validação de SQL antes de executar
- ✅ Rate limiting restritivo (`sensitive`)
- ✅ Secret adicional em produção (já existia)
- ✅ Logging completo de erros

---

## 🔒 Fluxo de Proteção

```
1. Requisição chega
   ↓
2. Rate Limiting (sensitive - muito restritivo)
   ↓
3. Middleware de Auditoria
   ├─ Extrai contexto do usuário (validateAuth)
   ├─ Cria log de auditoria ANTES
   └─ Bloqueia se auditoria falhar
   ↓
4. Validação de Autenticação (requireAuth - admin)
   ↓
5. Validação de Secret (produção)
   ↓
6. Validação de SQL (validateSQLOrThrow)
   ├─ Whitelist/Blacklist
   ├─ Padrões perigosos
   └─ Sanitização
   ↓
7. Execução da Operação
   ↓
8. Registro de Resultado (auditoria)
   ↓
9. Resposta
```

---

## 📊 Dados de Auditoria Registrados

Cada operação perigosa registra:

**Antes da execução:**
- `actor_id` - ID do usuário
- `action_type` - Nome da ação (ex: `execute_sql_fix`)
- `resource_type` - Tipo de recurso (ex: `database`)
- `details` - Detalhes da operação:
  - `path` - Caminho da rota
  - `method` - Método HTTP
  - `userEmail` - Email mascarado
  - `userRole` - Role do usuário
  - `ipAddress` - IP do usuário
  - `userAgent` - User-Agent
  - `timestamp` - Timestamp da operação

**Após a execução:**
- `action_type` - `{action}_result` ou `{action}_error`
- `details.success` - Se operação foi bem-sucedida
- `details.statusCode` - Status HTTP da resposta
- `details.error` - Mensagem de erro (se houver)

---

## ⚠️ Comandos SQL Permitidos

### Whitelist (Permitidos)
- `ALTER TABLE` - Modificar estrutura de tabelas
- `CREATE OR REPLACE FUNCTION` - Criar/atualizar funções
- `CREATE FUNCTION` - Criar funções
- `CREATE TRIGGER` - Criar triggers
- `DROP TRIGGER` - Remover triggers
- `UPDATE` - Atualizar dados
- `SELECT` - Consultar dados
- `INSERT` - Inserir dados
- `CREATE INDEX` - Criar índices
- `CREATE UNIQUE INDEX` - Criar índices únicos
- `DROP INDEX` - Remover índices
- `COMMENT` - Adicionar comentários

### Blacklist (Bloqueados)
- `DROP TABLE` - Remover tabelas
- `DROP DATABASE` - Remover banco
- `DROP SCHEMA` - Remover schema
- `TRUNCATE` - Limpar tabela
- `DELETE FROM` sem WHERE - Deletar sem condição
- `EXEC` / `EXECUTE` - Execução dinâmica

---

## 🚨 Avisos e Warnings

O validador emite warnings (não bloqueia) para:
- Comandos não na whitelist (mas não na blacklist)
- Múltiplas statements (> 5)
- SQL muito grande (> 10.000 caracteres)

---

## 📝 Exemplo de Uso

```typescript
import { withDangerousRouteAudit, AuditContext } from '@/lib/middleware/dangerous-route-audit'
import { validateSQLOrThrow } from '@/lib/validation/sql-validator'

async function dangerousHandler(
  request: NextRequest, 
  auditContext: AuditContext
) {
  const body = await request.json()
  const sql = body.sql
  
  // Validar SQL
  const validatedSQL = validateSQLOrThrow(sql)
  
  // Executar operação
  // ...
  
  return NextResponse.json({ success: true })
}

export const POST = withDangerousRouteAudit(
  dangerousHandler,
  'custom_sql_execution',
  'database'
)
```

---

## 🔍 Verificação de Auditoria

Para verificar logs de auditoria:

```sql
SELECT 
  actor_id,
  action_type,
  resource_type,
  details->>'userEmail' as user_email,
  details->>'ipAddress' as ip_address,
  created_at
FROM gf_audit_log
WHERE action_type LIKE '%sql%' OR action_type LIKE '%database%'
ORDER BY created_at DESC
LIMIT 50;
```

---

## ✅ Benefícios

1. **Rastreabilidade:** Todas as operações perigosas são registradas
2. **Segurança:** SQL validado antes de execução
3. **Compliance:** Auditoria completa para compliance
4. **Debugging:** Logs detalhados facilitam troubleshooting
5. **Prevenção:** Bloqueia comandos destrutivos automaticamente

---

**Última atualização:** 2025-01-XX
