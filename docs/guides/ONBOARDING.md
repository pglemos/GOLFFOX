# Guia de Onboarding - GolfFox

**Bem-vindo ao projeto GolfFox!** Este guia vai te ajudar a começar rapidamente.

---

## 🎯 O que é o GolfFox?

Sistema SaaS de gestão de transporte urbano com:
- Gestão de frota (veículos, motoristas, rotas)
- Rastreamento GPS em tempo real
- Múltiplos perfis (Admin, Empresa, Transportadora, Motorista, Passageiro)
- Relatórios automatizados
- Gestão financeira (custos, orçamentos, conciliação)

---

## 🚀 Setup Rápido

### Pré-requisitos

- Node.js 22.x
- npm >= 9.0.0
- Git
- Conta no Supabase (para desenvolvimento)

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd GOLFFOX
```

### 2. Configure Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e configure:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Outras variáveis necessárias
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 3. Instale Dependências

```bash
# Na raiz do projeto
npm install

# No app web
cd apps/web
npm install
```

### 4. Execute Migrations

```bash
# Aplicar migrations do Supabase
cd apps/web
npm run db:migrate
```

### 5. Inicie o Servidor de Desenvolvimento

```bash
cd apps/web
npm run dev
```

Acesse: `http://localhost:3000`

---

## 📁 Estrutura do Projeto

```
GOLFFOX/
├── apps/
│   ├── web/          # Next.js Web App
│   └── mobile/       # React Native Mobile App
├── supabase/
│   └── migrations/   # Migrations do banco
├── docs/             # Documentação geral
└── scripts/          # Scripts utilitários
```

### Estrutura do Web App

```
apps/web/
├── app/              # Next.js App Router (rotas e páginas)
│   ├── api/          # API Routes
│   ├── admin/        # Painel Admin
│   ├── empresa/      # Painel Empresa
│   └── transportadora/ # Painel Transportadora
├── components/       # Componentes React
├── lib/              # Utilitários e helpers
├── hooks/            # React Hooks customizados
├── types/            # TypeScript types
└── __tests__/        # Testes
```

---

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm run start
```

### Testes

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes E2E
npm run test:e2e
```

### Qualidade de Código

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Formatar código
npm run format
```

---

## 🔑 Conceitos Importantes

### Autenticação e Autorização

- **Proxy (`proxy.ts`):** Middleware que protege rotas de página
- **`requireAuth`:** Helper para proteger rotas de API
- **Roles:** `admin`, `empresa`, `transportadora`, `motorista`, `passageiro`

### Banco de Dados

- **Supabase:** PostgreSQL com Row Level Security (RLS)
- **Multi-tenant:** Isolamento de dados por empresa/transportadora
- **Migrations:** Em `supabase/migrations/`

### Logging

- **Use `lib/logger.ts`:** Nunca use `console.*` diretamente
- **Funções:** `debug()`, `warn()`, `logError()`

### Validação

- **Zod:** Use para validação de dados em APIs
- **Schemas compartilhados:** Em `lib/validation/`

---

## 📚 Próximos Passos

1. **Explore o código:**
   - Comece por `apps/web/app/page.tsx` (página de login)
   - Veja `apps/web/proxy.ts` (middleware de autenticação)
   - Explore `apps/web/lib/api-auth.ts` (helpers de autenticação)

2. **Leia a documentação:**
   - [Arquitetura do Sistema](../ARCHITECTURE.md)
   - [Guia de Desenvolvimento](DEVELOPMENT.md)
   - [Guia de Testes](TESTING.md)

3. **Contribua:**
   - Siga o [Guia de Contribuição](CONTRIBUTING.md)
   - Use Conventional Commits
   - Escreva testes para novas features

---

## 🆘 Precisa de Ajuda?

- **Documentação:** Consulte `/docs/`
- **Troubleshooting:** Veja [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **Issues:** Abra uma issue no repositório

---

**Última atualização:** 2025-01-XX
