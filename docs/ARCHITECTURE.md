# Arquitetura do GolfFox

## Visão Geral

O GolfFox é uma aplicação híbrida moderna que utiliza **React Native (Expo 54)** para mobile e **Next.js 16** para web, seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**. O backend é servido pelo **Supabase** (PostgreSQL + Auth + Storage + Realtime).

## Stack Tecnológica

### Frontend Mobile (React Native)
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React Native | 0.81.5 | Framework mobile |
| Expo | 54.0.27 | Build tool e runtime |
| TypeScript | 5.9.2 | Linguagem |
| Expo Router | 6.0.17 | Navegação file-based |
| React Native Paper | 5.14.5 | Componentes UI |
| react-native-maps | 1.26.20 | Mapas |
| expo-location | 19.0.8 | Geolocalização |

### Frontend Web (Next.js)
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 16.0.7 | Framework React |
| React | 19.2.1 | UI Library |
| TypeScript | 5.9.3 | Linguagem |
| Tailwind CSS | 4.1.17 | Estilização |
| Radix UI | Latest | Componentes acessíveis |
| Zustand | 5.0.2 | Estado global |
| TanStack Query | 5.90.12 | Cache e data fetching |

### Backend
| Tecnologia | Propósito |
|------------|-----------|
| Supabase | BaaS (Auth, Storage, Realtime) |
| PostgreSQL | Banco de dados relacional |
| Upstash Redis | Rate limiting |

## Estrutura do Projeto

```
📁 GOLFFOX/
├── 📱 apps/mobile/              # React Native App (Expo 54)
│   ├── app/                     # Expo Router (File-based routing)
│   │   ├── _layout.tsx          # Layout raiz (providers)
│   │   ├── index.tsx            # Tela inicial (redirect)
│   │   ├── login.tsx            # Tela de login
│   │   ├── driver/              # Rotas do Motorista
│   │   │   ├── _layout.tsx      # Stack do motorista
│   │   │   ├── index.tsx        # Dashboard motorista
│   │   │   ├── checklist.tsx    # Checklist pré-rota
│   │   │   ├── route.tsx        # Mapa com rastreamento
│   │   │   ├── scan.tsx         # Scanner QR/NFC
│   │   │   └── history.tsx      # Histórico de viagens
│   │   └── passenger/           # Rotas do Passageiro
│   │       ├── _layout.tsx      # Stack do passageiro
│   │       ├── index.tsx        # Dashboard passageiro
│   │       ├── map.tsx          # Mapa tempo real
│   │       ├── details.tsx      # Detalhes da rota
│   │       └── feedback.tsx     # Avaliação
│   ├── src/                     # Código-fonte
│   │   ├── auth/                # Autenticação (hooks, context)
│   │   ├── services/            # Supabase, geolocalização
│   │   ├── components/          # UI compartilhado
│   │   ├── features/            # Funcionalidades (checkin, tracking)
│   │   └── utils/               # Utilitários
│   ├── assets/                  # Ícones e imagens
│   ├── app.config.ts            # Configuração Expo
│   ├── eas.json                 # Configuração EAS Build
│   └── package.json             # Dependências
│
├── 🌐 apps/web/                 # Next.js Web App
│   ├── app/                     # App Router (Next.js 16 + Turbopack)
│   │   ├── admin/               # Painel Administrativo
│   │   ├── empresa/             # Painel da Empresa Contratante
│   │   ├── transportadora/      # Painel da Transportadora
│   │   ├── api/                 # API Routes
│   │   ├── page.tsx             # Página de Login
│   │   └── layout.tsx           # Layout Principal
│   ├── components/              # Componentes React
│   │   ├── ui/                  # Componentes UI base (Radix UI)
│   │   ├── admin/               # Componentes Admin
│   │   ├── empresa/             # Componentes Empresa
│   │   ├── transportadora/      # Componentes Transportadora
│   │   └── providers/           # Context Providers
│   ├── lib/                     # Utilitários e Helpers
│   │   ├── supabase.ts          # Cliente Supabase
│   │   ├── auth.ts              # Gerenciamento de Auth
│   │   └── logger.ts            # Sistema de Logging
│   ├── hooks/                   # React Hooks customizados
│   ├── middleware.ts            # Middleware Next.js
│   └── package.json             # Dependências
│
├── 📚 database/                 # Banco de Dados
│   ├── migrations/              # Migrations SQL
│   ├── seeds/                   # Dados iniciais
│   └── scripts/                 # Scripts SQL
│
├── 📚 docs/                     # Documentação técnica
├── 🔧 scripts/                  # Scripts de automação
└── 🏗️ supabase/                 # Configuração Supabase
```

## Camadas da Arquitetura

### 1. Presentation Layer (Apresentação)

#### Mobile (React Native)
- **Expo Router**: Navegação file-based em `app/`
- **Componentes**: React Native Paper + componentes customizados
- **Estado Local**: React useState/useReducer

```typescript
// Exemplo: apps/mobile/app/driver/index.tsx
import { View, Text } from 'react-native';
import { useAuth } from '@/src/auth/useAuth';

export default function DriverDashboard() {
  const { user } = useAuth();
  
  return (
    <View>
      <Text>Bem-vindo, {user?.name}</Text>
    </View>
  );
}
```

#### Web (Next.js)
- **App Router**: Navegação file-based em `app/`
- **Componentes**: Radix UI + Tailwind CSS
- **Estado Global**: Zustand para estado compartilhado

```typescript
// Exemplo: apps/web/app/admin/page.tsx
'use client';
import { useAdminKPIs } from '@/hooks/useAdminKPIs';

export default function AdminDashboard() {
  const { data, isLoading } = useAdminKPIs();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <KPICard title="Viagens" value={data.trips} />
    </div>
  );
}
```

### 2. Application Layer (Aplicação)

#### Hooks Customizados
Encapsulam lógica de negócio e data fetching:

```typescript
// Exemplo: apps/web/hooks/useAdminKPIs.ts
import { useQuery } from '@tanstack/react-query';

export function useAdminKPIs() {
  return useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: () => fetch('/api/admin/kpis').then(r => r.json()),
    staleTime: 30 * 1000, // 30 segundos
  });
}
```

#### Stores (Zustand)
Gerenciamento de estado global:

```typescript
// Exemplo: apps/web/stores/useAuthStore.ts
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

### 3. Domain Layer (Domínio)

Entidades e tipos compartilhados:

```typescript
// Exemplo: types/user.ts
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'empresa' | 'operador' | 'motorista' | 'passageiro';
  name: string;
  isActive: boolean;
}

export interface Trip {
  id: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
}
```

### 4. Infrastructure Layer (Infraestrutura)

#### Cliente Supabase
```typescript
// Exemplo: apps/web/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### API Routes (Next.js)
```typescript
// Exemplo: apps/web/app/api/admin/kpis/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('v_admin_kpis')
    .select('*')
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

## Gerenciamento de Estado

### Web (Next.js)

| Ferramenta | Uso |
|------------|-----|
| **Zustand** | Estado global (auth, UI, preferências) |
| **TanStack Query** | Cache de dados do servidor |
| **useState** | Estado local de componentes |
| **React Context** | Providers (tema, toast, modais) |

### Mobile (React Native)

| Ferramenta | Uso |
|------------|-----|
| **React Context** | Autenticação, tema |
| **useState/useReducer** | Estado local |
| **expo-secure-store** | Armazenamento seguro (tokens) |

## Segurança

### Autenticação
- Supabase Auth com cookies `httpOnly`
- JWT tokens com expiração de 1 hora
- Refresh tokens seguros

### Rate Limiting
```typescript
// Implementado com Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

### Proteção de Rotas
- **Middleware Next.js**: Valida sessão e redireciona baseado em roles
- **RLS no Supabase**: Isolamento de dados por empresa

## Testes

### Web
| Tipo | Ferramenta |
|------|------------|
| Unit Tests | Jest + Testing Library |
| E2E Tests | Playwright |
| Type Check | TypeScript |

### Mobile
| Tipo | Ferramenta |
|------|------------|
| Lint | ESLint |
| Type Check | TypeScript |
| Doctor | expo-doctor |

### Executando Testes

```bash
# Web - Testes unitários
cd apps/web
npm test

# Web - E2E
npm run test:e2e

# Mobile - Verificação
cd apps/mobile
npx expo-doctor
```

## Deploy

### Web (Vercel)
- Deploy automático via GitHub Actions
- Preview deployments para PRs
- Edge Functions para API routes

### Mobile (EAS Build)
- Build via Expo Application Services
- Distribuição para TestFlight (iOS) e Play Store (Android)

```bash
# Build de produção
eas build --platform all --profile production

# Submit para lojas
eas submit --platform all
```

## Performance

### Otimizações Implementadas

1. **Turbopack**: Build mais rápido no desenvolvimento
2. **React Server Components**: Redução de JavaScript no cliente
3. **Image Optimization**: Next.js Image com sharp
4. **Code Splitting**: Lazy loading automático
5. **Caching**: TanStack Query + HTTP cache

### Monitoramento

- **Vercel Analytics**: Métricas de performance
- **Vercel Speed Insights**: Core Web Vitals
- **Sentry** (planejado): Error tracking

## Conclusão

Esta arquitetura fornece uma base sólida para o desenvolvimento do GolfFox, garantindo:

- **Escalabilidade**: Estrutura modular para fácil adição de features
- **Manutenibilidade**: Separação clara de responsabilidades
- **Testabilidade**: Camadas desacopladas facilitam testes
- **Segurança**: Múltiplas camadas de proteção
- **Performance**: Otimizações modernas implementadas

Para mais detalhes sobre implementações específicas, consulte os demais documentos em `docs/`.