# Convenções de Tipagem TypeScript

**Data:** 2025-01-XX  
**Status:** Ativo

---

## Regras Gerais

### Quando usar `interface`

✅ **USE `interface` para:**
- Props de componentes React
- Objetos que podem ser estendidos (`extends`)
- Contratos de API (request/response)
- Estruturas de dados que representam entidades do domínio
- Tipos que podem ser implementados por classes

**Exemplo:**
```typescript
interface UserProps {
  id: string
  name: string
  email: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}
```

### Quando usar `type`

✅ **USE `type` para:**
- Unions (`|`)
- Intersections (`&`)
- Tipos derivados de schemas Zod (`z.infer<typeof schema>`)
- Tipos primitivos complexos
- Mapped types
- Tipos utilitários

**Exemplo:**
```typescript
type Status = 'pending' | 'approved' | 'rejected'

type UserWithRole = User & { role: 'admin' | 'user' }

type UserFromSchema = z.infer<typeof userSchema>

type ReadonlyUser = Readonly<User>
```

---

## Convenções Específicas

### Props de Componentes

**SEMPRE use `interface` para props:**
```typescript
// ✅ Correto
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant }: ButtonProps) {
  // ...
}

// ❌ Evitar
type ButtonProps = {
  label: string
  onClick: () => void
}
```

### Nomenclatura

- **Props:** `ComponentNameProps` (ex: `ButtonProps`, `UserCardProps`)
- **Interfaces de dados:** Nome descritivo (ex: `User`, `Vehicle`, `Route`)
- **Types:** Nome descritivo ou sufixo indicando tipo (ex: `Status`, `UserWithRole`)

### Tipos de Erro

**SEMPRE use `unknown` em catch blocks:**
```typescript
// ✅ Correto
try {
  // ...
} catch (error: unknown) {
  const err = error as Error
  // ...
}

// ❌ Evitar
try {
  // ...
} catch (error: any) {
  // ...
}
```

### Record Types

**SEMPRE use `unknown` ao invés de `any`:**
```typescript
// ✅ Correto
type Config = Record<string, unknown>

// ❌ Evitar
type Config = Record<string, any>
```

---

## Checklist de Revisão

Ao criar ou modificar tipos, verifique:

- [ ] Props de componentes usam `interface`
- [ ] Unions/intersections usam `type`
- [ ] `catch` blocks usam `unknown`
- [ ] `Record<string, ...>` usa `unknown` ao invés de `any`
- [ ] Nomes seguem convenção (`ComponentNameProps`)
- [ ] Tipos são exportados quando reutilizáveis

---

## Exceções

Alguns casos podem justificar desvios:

1. **Tabelas dinâmicas do Supabase:** `as any` pode ser necessário para tabelas dinâmicas
2. **Tipos de bibliotecas externas:** Seguir convenções da biblioteca
3. **Legacy code:** Manter consistência com código existente até refatoração completa

---

## Referências

- [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [TypeScript Handbook - Type Aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/consistent-type-definitions/)

