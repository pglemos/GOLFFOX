# Arquitetura do Sistema - GolfFox

Visão geral da arquitetura técnica do sistema GolfFox.

---

## 🏗️ Arquitetura Geral

### Monorepo

```
GOLFFOX/
├── apps/
│   ├── web/          # Next.js Web App
│   └── mobile/       # React Native Mobile App
├── supabase/
│   └── migrations/   # Migrations do banco
├── docs/             # Documentação
└── scripts/          # Scripts utilitários
```

---

## 🌐 Frontend Web

### Stack Tecnológica

- **Next.js 16.1** - Framework React com App Router
- **React 19.0 RC** - Biblioteca UI
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.17** - Estilização
- **Radix UI** - Componentes acessíveis
- **TanStack Query** - Cache e sincronização
- **Zustand** - Gerenciamento de estado

### Estrutura

```
apps/web/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Edge Runtime)
│   ├── admin/             # Painel Admin
│   ├── empresa/           # Painel Empresa
│   └── transportadora/    # Painel Transportadora
├── components/            # Componentes React
├── lib/                   # Utilitários
│   ├── api-auth.ts       # Autenticação
│   ├── logger.ts         # Logging
│   └── validation/       # Schemas Zod
├── hooks/                # React Hooks
├── types/                # TypeScript types
└── proxy.ts              # Middleware (Edge Runtime)
```

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

```
1. Usuário faz login → POST /api/auth/login
2. Servidor valida credenciais (Supabase Auth)
3. Servidor cria cookie de sessão (golffox-session)
4. Proxy (proxy.ts) valida sessão em cada requisição
5. Rotas protegidas verificam role via requireAuth
```

### Proteção de Rotas

- **Páginas:** Protegidas pelo `proxy.ts` (Edge Runtime)
- **APIs:** Protegidas por `requireAuth()` em cada rota

### Roles e Permissões

| Role | Acesso |
|------|--------|
| `admin` | Todas as rotas |
| `empresa` | `/empresa/*` |
| `transportadora` | `/transportadora/*` |
| `motorista` | Mobile app apenas |
| `passageiro` | Mobile app apenas |

---

## 🗄️ Backend e Banco de Dados

### Supabase

- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Isolamento multi-tenant
- **Auth** - Autenticação de usuários
- **Storage** - Armazenamento de arquivos
- **Realtime** - Sincronização em tempo real

### Estrutura do Banco

```
Principais Tabelas:
- users              # Usuários do sistema
- companies          # Empresas contratantes
- carriers           # Transportadoras
- vehicles           # Veículos
- routes            # Rotas
- trips             # Viagens
- gf_costs          # Custos
- gf_audit_log      # Logs de auditoria
```

### Multi-tenant

- Isolamento via RLS (Row Level Security)
- Cada empresa/transportadora vê apenas seus dados
- Service role bypassa RLS quando necessário

---

## 📱 Mobile App

### Stack

- **React Native** - Framework mobile
- **Expo 54** - Tooling e runtime
- **Expo Router** - File-based routing
- **TypeScript 5.9.2** - Type safety

### Funcionalidades

- Login/Autenticação
- Rastreamento GPS
- Checklists
- Feedback de passageiros

---

## 🔄 CI/CD

### GitHub Actions

- **Lint:** ESLint
- **Type Check:** TypeScript
- **Testes:** Jest + Playwright
- **Build:** Next.js build
- **Deploy:** Vercel (automático)

### Workflow

```
Push → CI (lint, test, build) → Deploy Vercel
```

---

## 🛡️ Segurança

### Implementado

- ✅ CSRF Protection (double-submit cookie)
- ✅ Rate Limiting (Upstash Redis)
- ✅ Input Sanitization
- ✅ Row Level Security (RLS)
- ✅ Secure Cookies (HttpOnly, SameSite)
- ✅ Content Security Policy (CSP)

### Práticas

- Validação de dados com Zod
- Sanitização de inputs
- Logging estruturado (sem dados sensíveis)
- Autenticação obrigatória em rotas protegidas

---

## 📊 Monitoramento

### Logging

- **Estruturado:** Via `lib/logger.ts`
- **Níveis:** `debug`, `warn`, `error`
- **Contexto:** Tags e metadados

### Métricas

- **Web Vitals:** Coletados via `/api/analytics/web-vitals`
- **Performance:** Monitoramento de queries e operações

---

## 🚀 Deploy

### Vercel

- **Web App:** Deploy automático via GitHub
- **Edge Runtime:** Para `proxy.ts` e API routes
- **Cron Jobs:** Configurados em `vercel.json`

### Variáveis de Ambiente

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## 📚 Padrões de Código

### Clean Architecture

- **Camada de Apresentação:** `app/`, `components/`
- **Camada de Aplicação:** `lib/services/`
- **Camada de Domínio:** `lib/repositories/`
- **Infraestrutura:** `lib/supabase-*`

### Repository Pattern

- Abstração de acesso a dados
- Facilita testes e manutenção

---

## 🔍 Diagramas

Ver diagramas em `/docs/diagrams/`:
- Fluxograma completo do sistema
- Fluxo de login
- Fluxo de viagens

---

**Última atualização:** 2025-01-XX
