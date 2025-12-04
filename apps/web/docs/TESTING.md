# Guia de Testes - GolfFox

Este documento descreve a estrutura de testes do projeto e como escrever novos testes.

## Estrutura de Testes

```
apps/web/
├── __tests__/
│   ├── api/                    # Testes de APIs
│   │   ├── auth/              # APIs de autenticação
│   │   ├── admin/             # APIs administrativas
│   │   ├── costs/             # APIs de custos
│   │   └── ...
│   ├── lib/                   # Testes de bibliotecas
│   ├── components/            # Testes de componentes React
│   ├── hooks/                 # Testes de hooks
│   └── helpers/               # Helpers e utilitários de teste
├── e2e/                       # Testes end-to-end
└── __mocks__/                 # Mocks globais
```

## Helpers Disponíveis

### `api-test-helpers.ts`

Funções utilitárias para criar requisições mockadas:

```typescript
import { createMockRequest, createAdminRequest, createOperatorRequest } from '../../helpers/api-test-helpers'

// Criar requisição básica
const req = createMockRequest({
  method: 'POST',
  body: { email: 'test@test.com' },
})

// Criar requisição autenticada como admin
const adminReq = createAdminRequest({
  method: 'POST',
  body: { name: 'Test' },
})

// Criar requisição autenticada como operador
const operatorReq = createOperatorRequest('company-1', {
  method: 'GET',
})
```

### `mock-supabase.ts`

Mock completo do Supabase Client:

```typescript
import { mockSupabaseClient } from '../../helpers/mock-supabase'

// Configurar dados de teste
mockSupabaseClient.setTableData('users', [
  { id: 'user-1', email: 'test@test.com', role: 'admin' }
])

// Configurar handlers RPC
mockSupabaseClient.setRPCHandler('get_user_by_id_for_login', async (params) => {
  return [{ id: params.p_user_id, email: 'test@test.com' }]
})
```

### `test-data.ts`

Factories para criar dados de teste:

```typescript
import { createTestUser, createTestTransportadora } from '../../helpers/test-data'

const user = createTestUser({ role: 'admin' })
const transportadora = createTestTransportadora()
```

## Padrões de Teste

### Testes de API

```typescript
import { POST } from '@/app/api/example/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'

describe('POST /api/example', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve fazer algo com dados válidos', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: { /* dados */ },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

### Testes de Componentes

```typescript
import { renderWithProviders } from '../../helpers/component-helpers'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('deve renderizar corretamente', () => {
    const { getByText } = renderWithProviders(<MyComponent />)
    expect(getByText('Hello')).toBeInTheDocument()
  })
})
```

## Cobertura de Testes

### Meta: 100% de Cobertura

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes de API
npm run test:api

# Apenas testes de componentes
npm run test:components

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# CI/CD
npm run test:ci
```

## Checklist para Novos Testes

- [ ] Testar casos de sucesso
- [ ] Testar casos de erro
- [ ] Testar validações
- [ ] Testar permissões/autorização
- [ ] Testar edge cases
- [ ] Testar rate limiting (quando aplicável)
- [ ] Usar mocks para dependências externas
- [ ] Manter testes independentes
- [ ] Documentar testes complexos

## Convenções

1. **Nomes de arquivos**: `*.test.ts` ou `*.spec.ts`
2. **Organização**: Um arquivo de teste por arquivo de código
3. **Estrutura**: `describe` para agrupar, `it` para casos individuais
4. **Setup**: Usar `beforeEach` para limpar mocks
5. **Assertions**: Usar expectativas claras e específicas

## Mocks Globais

Os seguintes módulos são mockados globalmente:

- `next/navigation` - useRouter, usePathname, etc.
- `@supabase/supabase-js` - Cliente Supabase
- `next-auth` - NextAuth

## Exemplos Completos

Veja os arquivos em `__tests__/api/auth/` para exemplos completos de testes de API.

