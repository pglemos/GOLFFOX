# Guia de Desenvolvimento - GolfFox

Convenções, padrões e boas práticas para desenvolvimento no projeto GolfFox.

---

## 🎯 Princípios

1. **Type Safety:** TypeScript strict mode
2. **Logging Estruturado:** Use `lib/logger.ts`, nunca `console.*`
3. **Validação:** Zod para validação de dados
4. **Autenticação:** Sempre use `requireAuth` em APIs protegidas
5. **Testes:** Escreva testes para novas features

---

## 📝 Convenções de Código

### Nomenclatura

- **Arquivos:** `kebab-case` (ex: `user-profile.tsx`)
- **Componentes:** `PascalCase` (ex: `UserProfile`)
- **Funções/Variáveis:** `camelCase` (ex: `getUserProfile`)
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`)

### Estrutura de Arquivos

```
app/
├── api/              # API Routes
│   └── [route]/route.ts
├── [role]/          # Páginas por role
│   └── page.tsx
components/
├── ui/              # Componentes base (Radix UI)
└── [feature]/       # Componentes de features
lib/
├── api-auth.ts      # Autenticação
├── logger.ts        # Logging
└── validation/      # Schemas Zod
```

---

## 🔐 Autenticação e Autorização

### Proteger Rotas de API

```typescript
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const authErrorResponse = await requireAuth(request, 'admin')
  if (authErrorResponse) {
    return authErrorResponse
  }
  // ... resto do código
}
```

### Roles Disponíveis

- `admin` - Acesso total
- `empresa` - Empresa contratante
- `transportadora` - Transportadora
- `motorista` - Motorista
- `passageiro` - Passageiro

---

## 📊 Logging

### Sempre use logger estruturado

```typescript
import { debug, warn, logError } from '@/lib/logger'

// Debug (desenvolvimento)
debug('Processando requisição', { userId, action }, 'ComponentName')

// Aviso
warn('Operação pode falhar', { context }, 'ComponentName')

// Erro
logError('Erro ao processar', { error, context }, 'ComponentName')
```

### ❌ NUNCA use

```typescript
console.log('...')  // ❌
console.error('...') // ❌
console.warn('...')  // ❌
```

---

## ✅ Validação de Dados

### Use Zod para validação

```typescript
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'empresa', 'transportadora']),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = createUserSchema.parse(body)
  // ... usar validated
}
```

---

## 🧪 Testes

### Estrutura de Testes

```typescript
import { describe, test, expect } from '@jest/globals'

describe('FeatureName', () => {
  test('deve fazer X quando Y', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = functionToTest(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### Executar Testes

```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🔄 Git Workflow

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar funcionalidade X
fix: corrigir bug Y
docs: atualizar documentação
refactor: refatorar código
test: adicionar testes
```

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/nome-feature` - Novas features
- `fix/nome-fix` - Correções

---

## 📦 Dependências

### Adicionar Nova Dependência

```bash
cd apps/web
npm install package-name
```

### Atualizar Dependências

```bash
npm update
npm audit fix
```

---

## 🚀 Deploy

### Build Local

```bash
npm run build
```

### Deploy Vercel

O deploy é automático via GitHub Actions quando há push em `main`.

---

## 📚 Recursos

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Zod Docs](https://zod.dev/)

---

**Última atualização:** 2025-01-XX
