# Guia de Organização do Projeto GolfFox

**Data:** 2025-01-XX  
**Status:** Em Implementação

## Estrutura de Pastas

### Components (`apps/web/components/`)

Organização híbrida consistente:

```
components/
├── ui/                    # Componentes base (shadcn) - organização por tipo
├── shared/                # Componentes compartilhados entre features
├── features/              # Organização por feature
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── map/
│   │   └── routes/
│   ├── empresa/
│   ├── transportadora/
│   ├── costs/
│   └── maps/              # Componentes de mapa genéricos
│       ├── admin-map/
│       ├── route-map/
│       └── fleet-map/
└── modals/                # Modais compartilhados
```

**Regras:**
- Componentes específicos de uma feature → `features/{feature}/`
- Componentes compartilhados entre features → `shared/`
- Componentes base/UI → `ui/`
- Modais compartilhados → `modals/`

### Lib (`apps/web/lib/`)

Organização por camada:

```
lib/
├── core/                  # Core do sistema
│   ├── auth/              # Autenticação
│   ├── supabase/          # Clientes Supabase
│   └── logger.ts          # Logger centralizado
├── domain/                # Domain layer (DDD)
├── services/              # Services layer
│   ├── map/
│   ├── costs/
│   └── alerts/
├── api/                   # API clients
├── utils/                 # Utilitários puros
└── types/                 # Tipos compartilhados
```

**Regras:**
- Core do sistema → `core/`
- Lógica de negócio → `services/`
- Utilitários puros → `utils/`
- Tipos compartilhados → `types/`

### API Routes (`apps/web/app/api/`)

Organização por domínio:

```
app/api/
├── admin/
│   ├── companies/
│   ├── carriers/          # Unificado (transportadora/transportadoras → carriers)
│   ├── drivers/
│   └── routes/
├── empresa/
├── transportadora/        # Nomenclatura unificada
├── costs/
└── shared/                # Rotas compartilhadas
    ├── auth/
    └── health/
```

**Regras:**
- Agrupar por domínio de negócio
- Usar nomenclatura consistente (carriers, não transportadora/transportadoras)
- Seguir padrão REST quando possível

## Padrões de Import

### Ordem de Imports

1. **React** (built-in)
2. **Bibliotecas externas** (framer-motion, lucide-react, etc.)
3. **Next.js** (next, next/navigation, etc.)
4. **Internos com alias** (`@/components`, `@/lib`, etc.)
5. **Imports relativos** (apenas durante transição)
6. **Tipos** (usar `import type`)

### Exemplo

```typescript
// React
import { useState, useEffect } from 'react'

// Externos
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

// Internos - features
import { useMapFilters } from '@/stores/map-filters'
import { loadVehicles } from '@/lib/services/map/vehicle-loader'

// Tipos
import type { Veiculo, RoutePolyline } from '@/types/map'
```

### Regras

- ✅ Sempre usar aliases `@/` ao invés de relativos
- ✅ Agrupar imports por categoria
- ✅ Máximo de 10-12 imports por arquivo (dividir se necessário)
- ✅ Usar `import type` para imports apenas de tipos
- ❌ Evitar imports relativos profundos (`../../../`)

## Arquivos Grandes

### Limite Recomendado

- **Componentes:** Máximo 500 linhas
- **Hooks:** Máximo 300 linhas
- **Services:** Máximo 400 linhas
- **API Routes:** Máximo 300 linhas

### Quando Dividir

1. Arquivo > limite recomendado
2. Múltiplas responsabilidades
3. Dificuldade de manutenção
4. Testes difíceis de escrever

### Como Dividir

1. Extrair hooks customizados
2. Criar serviços separados
3. Dividir em subcomponentes
4. Separar lógica de apresentação

## Nomenclatura

### Arquivos

- **Componentes:** `kebab-case.tsx` (ex: `admin-map.tsx`)
- **Hooks:** `use-kebab-case.ts` (ex: `use-map-data.ts`)
- **Services:** `kebab-case.service.ts` (ex: `vehicle-loader.service.ts`)
- **Types:** `kebab-case.types.ts` (ex: `map.types.ts`)

### Pastas

- **Features:** `kebab-case` (ex: `admin-map/`)
- **Services:** `kebab-case` (ex: `map-services/`)

## Boas Práticas

### 1. Separação de Responsabilidades

- Componentes: apenas apresentação
- Hooks: lógica de estado e efeitos
- Services: lógica de negócio
- Utils: funções puras

### 2. Reutilização

- Componentes compartilhados → `shared/`
- Hooks compartilhados → `hooks/`
- Utils compartilhados → `lib/utils/`

### 3. Testabilidade

- Funções puras quando possível
- Injeção de dependências
- Separação de lógica de apresentação

### 4. Performance

- Code splitting por feature
- Lazy loading de componentes pesados
- Memoização quando necessário

## Migração Gradual

### Fase 1: Estrutura ✅
- Criar nova estrutura de pastas
- Manter compatibilidade

### Fase 2: Refatoração (Em andamento)
- Dividir arquivos grandes
- Mover componentes para features
- Padronizar imports

### Fase 3: Consolidação
- Unificar nomenclatura
- Reorganizar lib/
- Atualizar todos os imports

### Fase 4: Validação
- Executar testes
- Verificar build
- Validar performance

## Ferramentas

- **ESLint:** Ordenação de imports
- **TypeScript:** Verificação de tipos
- **Scripts:** Migração automática

## Referências

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Style Guide](https://typescript-eslint.io/)

