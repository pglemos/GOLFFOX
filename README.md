# 🚌 GolfFox - Sistema de Gestão de Transporte Urbano

[![Flutter](https://img.shields.io/badge/Flutter-3.24+-blue.svg)](https://flutter.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Painéis Disponíveis](#-painéis-disponíveis)
- [Sistema de Autenticação](#-sistema-de-autenticação)
- [Quick Start](#-quick-start)
- [Configuração de Ambiente](#-configuração-de-ambiente)
- [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
- [API Routes](#-api-routes)
- [Perfis de Usuário](#-perfis-de-usuário)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)

## 📋 Sobre o Projeto

O **GolfFox** é uma plataforma completa de gestão de transporte urbano que oferece soluções integradas para empresas de ônibus, operadores, motoristas e passageiros. O sistema combina tecnologias modernas para fornecer rastreamento em tempo real, gestão de rotas, controle de custos e uma experiência de usuário excepcional.

### 🎯 Principais Funcionalidades

- **🚌 Gestão de Frota**: Controle completo de veículos, motoristas e rotas
- **📍 Rastreamento em Tempo Real**: Monitoramento GPS com atualizações instantâneas
- **👥 Multi-perfil**: Suporte para Admin, Operador, Transportadora, Motorista e Passageiro
- **📊 Dashboard Analytics**: Relatórios detalhados e métricas de performance
- **🔒 Segurança Avançada**: Rate limiting, sanitização de dados, CSRF protection e logging seguro
- **📱 Multiplataforma**: Apps móveis (iOS/Android) e web responsivo
- **🌐 API RESTful**: Integração fácil com sistemas terceiros
- **🏢 Multi-tenant**: Suporte para múltiplas empresas com isolamento de dados
- **📈 Relatórios Automatizados**: Geração e envio automático de relatórios
- **💰 Gestão de Custos**: Controle financeiro completo com conciliação

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura híbrida moderna:

- **Frontend Mobile**: Flutter 3.24+ (iOS/Android)
- **Frontend Web**: Next.js 15 com TypeScript, App Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Arquitetura**: Clean Architecture + Domain Driven Design
- **Estado**: Provider Pattern (Flutter) + React Hooks + Zustand (Next.js)
- **Estilização**: Tailwind CSS + Framer Motion
- **Mapas**: Google Maps API
- **Deploy**: Vercel (Web) + GitHub Actions (CI/CD)

### Estrutura do Projeto

```
📁 GOLFFOX/
├── 📱 lib/                    # Flutter App (Mobile)
│   ├── 🏗️ core/              # Camada Core (Shared)
│   │   ├── auth/             # Sistema de autenticação
│   │   ├── config/           # Configurações
│   │   ├── error/             # Tratamento de erros
│   │   ├── logging/           # Sistema de logging
│   │   ├── routing/           # Roteamento
│   │   ├── security/          # Segurança
│   │   └── theme/             # Temas e estilos
│   ├── 🎯 features/          # Features por domínio
│   │   ├── auth/             # Autenticação
│   │   ├── drivers/          # Motoristas
│   │   ├── mapa/             # Mapa e rastreamento
│   │   ├── routes/           # Rotas
│   │   └── vehicles/         # Veículos
│   ├── 📊 models/            # Modelos de dados
│   └── 🎨 widgets/           # Componentes reutilizáveis
│
├── 🌐 web-app/               # Next.js Web App
│   ├── app/                  # App Router (Next.js 15)
│   │   ├── admin/            # Painel Administrativo
│   │   ├── operator/         # Painel do Operador
│   │   ├── carrier/          # Painel da Transportadora
│   │   ├── driver/           # Painel do Motorista
│   │   ├── passenger/        # Painel do Passageiro
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Autenticação
│   │   │   ├── admin/        # Endpoints Admin
│   │   │   ├── operator/      # Endpoints Operador
│   │   │   ├── costs/        # Gestão de Custos
│   │   │   ├── reports/      # Relatórios
│   │   │   └── cron/         # Cron Jobs
│   │   ├── page.tsx          # Página de Login
│   │   └── layout.tsx        # Layout Principal
│   ├── components/           # Componentes React
│   │   ├── ui/               # Componentes UI base
│   │   ├── admin/            # Componentes Admin
│   │   ├── operator/         # Componentes Operador
│   │   └── modals/           # Modais
│   ├── lib/                  # Utilitários e Helpers
│   │   ├── supabase.ts       # Cliente Supabase
│   │   ├── auth.ts           # Gerenciamento de Auth
│   │   ├── api-auth.ts       # Helpers de autenticação API
│   │   └── logger.ts         # Sistema de Logging
│   ├── middleware.ts        # Middleware Next.js
│   └── scripts/              # Scripts utilitários
│
├── 📚 database/              # Banco de Dados
│   ├── migrations/           # Migrations SQL (v1-v49+)
│   ├── seeds/                # Dados iniciais
│   └── scripts/              # Scripts SQL
│
├── 📚 docs/                   # Documentação técnica
├── 🧪 test/                   # Testes automatizados
└── 🔧 scripts/                # Scripts de automação
```

## 🎯 Funcionalidades

### Painel Administrativo (`/admin`)

**Acesso**: Apenas usuários com role `admin`

**URL**: https://golffox.vercel.app/admin

#### Módulos Implementados

1. **Dashboard** - KPIs em tempo real com filtros por empresa, data e turno
   - Total de viagens do dia
   - Veículos ativos
   - Funcionários em trânsito
   - Alertas críticos
   - Rotas do dia
   - Log de atividades recentes

2. **Mapa da Frota** (`/admin/mapa`) - Visualização ao vivo com Google Maps
   - Rastreamento em tempo real
   - Playback histórico com controles de velocidade
   - Export PNG/CSV do mapa
   - Filtros avançados (empresa, rota, veículo, status, turno)
   - Deep-links para compartilhamento
   - Legenda interativa

3. **Rotas** (`/admin/rotas`) - CRUD completo
   - Criação e edição de rotas
   - Geração automática de pontos de parada
   - Otimização de rotas
   - Visualização no mapa

4. **Veículos** (`/admin/veiculos`) - CRUD completo
   - Cadastro de veículos
   - Manutenção preventiva
   - Checklist de veículos
   - Histórico de manutenções

5. **Motoristas** (`/admin/motoristas`) - CRUD completo
   - Cadastro de motoristas
   - Documentos e certificações
   - Ranking e gamificação
   - Avaliações

6. **Empresas** (`/admin/empresas`) - CRUD completo
   - Cadastro de empresas
   - Funcionários cadastrados
   - Associação de operadores
   - Configurações de branding

7. **Permissões** (`/admin/permissoes`) - Gestão de papéis
   - Controle de acesso
   - Papéis: admin, operator, carrier, driver, passenger
   - Troca de papéis de usuários

8. **Socorro** (`/admin/socorro`) - Ocorrências
   - Despache de emergência
   - Histórico de ocorrências
   - Status de atendimento

9. **Alertas** (`/admin/alertas`) - Notificações
   - Histórico com filtros
   - Tipos: erro, aviso, info
   - Busca e paginação

10. **Relatórios** (`/admin/relatorios`) - Análises
    - Relatórios de atrasos
    - Ocupação de veículos
    - Passageiros não embarcados
    - Eficiência de rotas
    - Ranking de motoristas
    - Export PDF/Excel/CSV
    - Agendamento automático via cron
    - Envio por email

11. **Custos** (`/admin/custos`) - Gestão financeira
    - Cálculo por rota/empresa/veículo
    - Conciliação de faturas
    - Orçamentos
    - Categorias de custos
    - Export de relatórios
    - Import de dados

12. **Ajuda & Suporte** (`/admin/ajuda-suporte`) - Central de ajuda
    - FAQ
    - Suporte WhatsApp
    - Documentação

13. **Sincronização** (`/admin/sincronizacao`) - Monitor Supabase
    - Histórico de operações
    - Reprocessamento de falhas
    - Status em tempo real

### Painel do Operador (`/operator`)

**Acesso**: Usuários com role `operator` ou `admin`

**URL**: https://golffox.vercel.app/operator

#### Módulos Implementados

1. **Dashboard** - Visão geral das viagens da empresa
   - Total de viagens
   - Viagens em andamento
   - Viagens concluídas
   - Atrasos acima de 5 minutos
   - Ocupação média
   - Custo diário
   - SLA D0
   - Lista de viagens com filtros

2. **Funcionários** (`/operator/funcionarios`) - Portal do Operador
   - Lista de funcionários da empresa
   - Busca e filtros
   - Cadastro de funcionários
   - Geocodificação automática de endereços

3. **Rotas** (`/operator/rotas`) - Rotas atribuídas
   - Visualização de rotas
   - Status das rotas
   - Mapa de rotas (`/operator/rotas/mapa`)

4. **Alertas** (`/operator/alertas`) - Alertas específicos
   - Filtros por tipo (erro, aviso, info)
   - Busca

5. **Comunicações** (`/operator/comunicacoes`) - Comunicação com funcionários

6. **Conformidade** (`/operator/conformidade`) - Conformidade regulatória

7. **Custos** (`/operator/custos`) - Custos da empresa

8. **Relatórios** (`/operator/relatorios`) - Relatórios da empresa

9. **Solicitações** (`/operator/solicitacoes`) - Solicitações de funcionários

10. **Prestadores** (`/operator/prestadores`) - Gestão de prestadores

11. **Ajuda** (`/operator/ajuda`) - Central de ajuda
    - FAQ
    - Suporte WhatsApp
    - Documentação
    - Status do sistema

12. **Sincronizar** (`/operator/sincronizar`) - Sincronização de dados

13. **Preferências** (`/operator/preferencias`) - Configurações

### Painel da Transportadora (`/carrier`)

**Acesso**: Usuários com role `carrier` ou `admin`

**URL**: https://golffox.vercel.app/carrier

#### Módulos Implementados

1. **Dashboard** - Visão geral da transportadora
2. **Mapa** (`/carrier/mapa`) - Visualização da frota
3. **Veículos** (`/carrier/veiculos`) - Gestão de veículos
4. **Motoristas** (`/carrier/motoristas`) - Gestão de motoristas
5. **Relatórios** (`/carrier/relatorios`) - Relatórios
6. **Alertas** (`/carrier/alertas`) - Alertas
7. **Ajuda** (`/carrier/ajuda`) - Central de ajuda

## 🔐 Sistema de Autenticação

### Fluxo de Autenticação

O sistema utiliza autenticação baseada em cookies com verificação obrigatória no banco de dados:

1. **Login** (`POST /api/auth/login`)
   - Verifica se o usuário existe na tabela `users` do Supabase
   - Verifica se o usuário está ativo (`is_active = true`)
   - Obtém o role da tabela `users` (fonte de verdade)
   - Autentica com Supabase Auth
   - Cria cookie de sessão `golffox-session` (base64)
   - Retorna token + user payload com role

2. **Sessão**
   - Cookie `golffox-session` contém: `{ id, email, role, accessToken }`
   - Cookie válido por 1 hora
   - Middleware valida cookie em todas as rotas protegidas

3. **Redirecionamento**
   - Baseado no role do banco de dados:
     - `admin` → `/admin`
     - `operator` → `/operator`
     - `carrier` → `/carrier`
     - `driver` → `/driver`
     - `passenger` → `/passenger`

### Proteção de Rotas

O middleware (`web-app/middleware.ts`) protege automaticamente:

- `/admin/*` - Apenas role `admin`
- `/operator/*` - Roles `admin` ou `operator`
- `/carrier/*` - Roles `admin` ou `carrier`

### CSRF Protection

- Token CSRF via double-submit cookie
- Endpoint: `GET /api/auth/csrf`
- Header obrigatório: `x-csrf-token`

## 🚀 Quick Start

### Pré-requisitos

- **Flutter SDK**: 3.24+
- **Node.js**: 18.17.0+
- **npm**: 9.0.0+
- **Git**: Última versão
- **Supabase**: Conta e projeto criado

### 1️⃣ Clonagem e Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/pglemos/GOLFFOX.git
cd GOLFFOX

# Configure as variáveis de ambiente
cd web-app
cp .env.example .env.local
# Edite o arquivo .env.local com suas configurações
```

### 2️⃣ Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations na ordem:
   ```sql
   -- Execute no SQL Editor do Supabase
   -- Todas as migrations estão em database/migrations/
   -- Execute na ordem: v1, v2, v3, ..., v49
   ```
3. Configure as políticas RLS (Row Level Security)
4. Adicione as chaves no arquivo `.env.local`

### 3️⃣ Setup Next.js (Web)

```bash
# Navegue para o diretório web
cd web-app

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# A aplicação estará disponível em http://localhost:3000
```

### 4️⃣ Setup Flutter (Mobile)

```bash
# Na raiz do projeto
flutter pub get

# Execute a análise de código
flutter analyze

# Execute os testes
flutter test

# Execute o app (desenvolvimento web)
flutter run -d web-server --web-port 8000

# Execute o app (Android/iOS)
flutter run
```

### 5️⃣ Primeiro Login

1. Acesse http://localhost:3000
2. Use as credenciais padrão:
   - **Admin**: `golffox@admin.com` / `senha123`
   - **Operador**: `operador@empresa.com` / `senha123`

**⚠️ IMPORTANTE**: Certifique-se de que o usuário existe na tabela `users` do Supabase e está associado a uma empresa na tabela `gf_user_company_map`.

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente Essenciais

Crie o arquivo `web-app/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Autenticação
NEXT_PUBLIC_AUTH_ENDPOINT=/api/auth/login
NEXT_PUBLIC_LOGGED_URL=/operator

# Mapas
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_google_maps

# Logs e Debug
NODE_ENV=development
NEXT_PUBLIC_LOG_LEVEL=debug

# Vercel (opcional)
VERCEL_URL=golffox.vercel.app
```

### Configuração do Supabase

#### 1. Criar Projeto

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves (anon key e service role key)

#### 2. Aplicar Migrations

Execute as migrations na ordem no SQL Editor do Supabase:

```bash
# As migrations estão em database/migrations/
# Execute na ordem numérica: v1, v2, v3, ..., v49
```

Principais migrations:
- `v1_initial_schema.sql` - Schema inicial
- `v47_rls_fixes.sql` - Correções RLS
- `v49_protect_user_company_map.sql` - Proteção de mapeamento

#### 3. Configurar RLS (Row Level Security)

As políticas RLS são aplicadas automaticamente pelas migrations. Verifique se estão ativas:

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

#### 4. Seeds (Dados Iniciais)

Execute os seeds para dados de desenvolvimento:

```sql
-- Execute os scripts em database/seeds/
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **`users`** - Usuários do sistema (admin, operator, carrier, driver, passenger)
- **`companies`** - Empresas operadoras
- **`gf_user_company_map`** - Mapeamento usuário-empresa (multi-tenant)
- **`vehicles`** - Veículos da frota
- **`drivers`** - Motoristas
- **`routes`** - Rotas de transporte
- **`trips`** - Viagens realizadas
- **`gf_employee_company`** - Funcionários das empresas
- **`gf_costs`** - Custos operacionais
- **`gf_report_schedules`** - Agendamentos de relatórios
- **`audit_logs`** - Log de auditoria

### Views Principais

- **`v_my_companies`** - Empresas do operador (com RLS)
- **`v_admin_kpis`** - KPIs para admin
- **`mv_operator_kpis`** - Materialized view de KPIs do operador
- **`v_reports_*`** - Views para relatórios

### RLS (Row Level Security)

Todas as tabelas possuem políticas RLS configuradas:
- Usuários veem apenas dados de suas empresas
- Operadores veem apenas dados de empresas associadas
- Admins veem todos os dados

## 🔌 API Routes

### Autenticação

- `POST /api/auth/login` - Login (verifica banco de dados)
- `POST /api/auth/set-session` - Definir sessão
- `POST /api/auth/clear-session` - Limpar sessão
- `GET /api/auth/csrf` - Obter token CSRF
- `POST /api/auth/seed-admin` - Criar usuário admin (desenvolvimento)

### Admin

- `POST /api/admin/create-operator` - Criar operador
- `POST /api/admin/generate-stops` - Gerar pontos de parada
- `POST /api/admin/optimize-route` - Otimizar rota
- `GET /api/admin/audit-db` - Auditoria do banco
- `GET/PUT/DELETE /api/admin/vehicles/[vehicleId]` - CRUD de veículos

### Operador

- `POST /api/operator/associate-company` - Associar operador a empresa
- `POST /api/operator/create-employee` - Criar funcionário
- `POST /api/operator/optimize-route` - Otimizar rota

### Custos

- `GET /api/costs/kpis` - KPIs de custos
- `GET /api/costs/budgets` - Orçamentos
- `POST /api/costs/budgets` - Criar orçamento
- `DELETE /api/costs/budgets` - Deletar orçamento
- `GET /api/costs/categories` - Categorias
- `POST /api/costs/manual` - Adicionar custo manual
- `GET /api/costs/manual` - Listar custos
- `POST /api/costs/reconcile` - Conciliação
- `GET /api/costs/export` - Export de custos
- `POST /api/costs/import` - Import de custos
- `GET /api/costs/vs-budget` - Comparação com orçamento

### Relatórios

- `POST /api/reports/run` - Gerar relatório
- `POST /api/reports/schedule` - Agendar relatório
- `POST /api/reports/dispatch` - Despachar relatório

### Cron Jobs

- `GET /api/cron/refresh-kpis` - Atualizar KPIs
- `GET /api/cron/refresh-costs-mv` - Atualizar materialized views de custos
- `GET /api/cron/dispatch-reports` - Despachar relatórios agendados

### Analytics

- `POST /api/analytics/web-vitals` - Métricas de performance

### Health

- `GET /api/health` - Health check

## 👥 Perfis de Usuário

### 🔑 Admin

**Role**: `admin`

**Acesso**: Painel `/admin`

**Permissões**:
- Gestão completa do sistema
- Configuração de empresas e operadores
- Relatórios globais e analytics
- Gerenciamento de permissões
- Acesso a todos os dados

**Credenciais padrão**: `golffox@admin.com` / `senha123`

### 🏢 Operador (Empresa)

**Role**: `operator`

**Acesso**: Painel `/operator`

**Permissões**:
- Gestão de funcionários da empresa
- Visualização de rotas atribuídas
- Relatórios da empresa
- Alertas da empresa
- Custos da empresa

**Credenciais padrão**: `operador@empresa.com` / `senha123`

**⚠️ IMPORTANTE**: O operador precisa estar associado a uma empresa na tabela `gf_user_company_map`.

### 🚛 Transportadora

**Role**: `carrier`

**Acesso**: Painel `/carrier`

**Permissões**:
- Gestão de frota
- Controle de motoristas
- Monitoramento de rotas
- Relatórios da transportadora

### 🚗 Motorista

**Role**: `driver`

**Acesso**: App Flutter + Painel `/driver`

**Permissões**:
- App móvel para check-in/check-out
- Navegação GPS integrada
- Comunicação com central
- Histórico de viagens

### 🎫 Passageiro

**Role**: `passenger`

**Acesso**: App Flutter + Painel `/passenger`

**Permissões**:
- Rastreamento de ônibus em tempo real
- Informações de rotas e horários
- Notificações de chegada
- Avaliação do serviço

## 🔄 Sistema Multi-Tenant

O sistema suporta múltiplas empresas com isolamento completo de dados:

### Tabela `gf_user_company_map`

Mapeia usuários (operadores) a empresas:

```sql
CREATE TABLE gf_user_company_map (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### View `v_my_companies`

View com RLS que retorna apenas empresas do operador logado:

```sql
CREATE VIEW v_my_companies AS
SELECT c.*
FROM companies c
INNER JOIN gf_user_company_map m ON m.company_id = c.id
WHERE m.user_id = auth.uid();
```

### Associar Operador a Empresa

1. Via Admin Panel:
   - Acesse `/admin/empresas`
   - Clique em "Associar Operador"
   - Selecione o operador e a empresa

2. Via API:
   ```bash
   POST /api/operator/associate-company
   {
     "email": "operador@empresa.com",
     "companyId": "uuid-da-empresa"
   }
   ```

3. Via SQL:
   ```sql
   INSERT INTO gf_user_company_map (user_id, company_id)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'operador@empresa.com'),
     'uuid-da-empresa'
   );
   ```

## 📦 Build e Deploy

### Next.js (Web)

```bash
cd web-app

# Build para produção
npm run build

# Testar build localmente
npm start

# Deploy no Vercel
vercel deploy --prod
```

### Flutter (Mobile)

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release

# Web
flutter build web --release
```

### Deploy no Vercel

1. **Instalar CLI**: `npm i -g vercel`
2. **Link do projeto**: `cd web-app && vercel link`
3. **Configurar variáveis**: Vercel Dashboard → Settings → Environment Variables
4. **Deploy**: `vercel deploy --prod`

#### Variáveis de Ambiente no Vercel

Configure no Vercel Dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_AUTH_ENDPOINT`
- `NEXT_PUBLIC_LOGGED_URL`

#### Cron Jobs no Vercel

Configure no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-kpis",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/dispatch-reports",
      "schedule": "0 * * * *"
    }
  ]
}
```

## 🧪 Testes

### Executar Todos os Testes

```bash
# Flutter - Testes unitários
flutter test

# Flutter - Testes de integração
flutter test integration_test/

# Next.js - Testes
cd web-app
npm test
npm run test:e2e
```

### Cobertura de Testes

```bash
# Flutter - Relatório de cobertura
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Next.js - Cobertura
cd web-app
npm run test:coverage
```

### Scripts de Teste

```bash
# Testar fluxo de login
cd web-app
node scripts/test-login-flow.js

# Testar autenticação de API
node scripts/test-api-auth.js

# Testar middleware
node scripts/test-middleware-auth.js

# Testar RLS
node scripts/test-rls.js
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Login não redireciona

**Sintomas**: Login bem-sucedido mas não redireciona para o painel

**Soluções**:
1. Verifique se o usuário existe na tabela `users` do Supabase
2. Verifique se o usuário está ativo (`is_active = true`)
3. Verifique se o role está definido na tabela `users`
4. Verifique o console do navegador (F12) para logs de debug
5. Verifique se o cookie `golffox-session` está sendo definido

#### "Nenhuma empresa encontrada para o operador"

**Sintomas**: Operador loga mas não vê empresas

**Soluções**:
1. Associe o operador a uma empresa:
   - Via Admin Panel: `/admin/empresas` → "Associar Operador"
   - Via API: `POST /api/operator/associate-company`
   - Via SQL: Inserir em `gf_user_company_map`

#### Erro de CSRF

**Sintomas**: "Erro de segurança" ao fazer login

**Soluções**:
1. Recarregue a página (o token CSRF é gerado automaticamente)
2. Verifique se o cookie `golffox-csrf` está sendo definido
3. Limpe os cookies e tente novamente

#### Middleware bloqueando acesso

**Sintomas**: Redirecionado para login mesmo estando logado

**Soluções**:
1. Verifique se o cookie `golffox-session` está presente
2. Verifique se o cookie não expirou (válido por 1 hora)
3. Verifique se o role no cookie corresponde ao necessário
4. Verifique os logs do middleware (em desenvolvimento)

#### Flutter não compila

```bash
flutter clean
flutter pub get
flutter pub deps
```

#### Erro de dependências Next.js

```bash
cd web-app
rm -rf node_modules package-lock.json
npm install
```

#### Problemas de permissão (RLS)

- Verifique as configurações do Supabase RLS
- Confirme as chaves de API no `.env`
- Execute as migrations na ordem correta

#### Hook de contexto fora do provider

**Mensagem**: `⚠️ useOperatorTenant usado fora do OperatorTenantProvider`

**Causa**: Componente usando o hook em páginas sem o provider

**Correção**: Condicionar o uso do componente a rotas do operador ou envolver o layout com `OperatorTenantProvider`

#### Hydration mismatch

**Causa**: `Math.random()` e dimensões variáveis entre SSR e cliente

**Correção**: Importar dinamicamente com `ssr: false` ou tornar o layout determinístico

#### `useSearchParams is not defined`

**Causa**: Hook usado em componente sem `"use client"`

**Correção**: Adicionar `"use client"` e `import { useSearchParams } from 'next/navigation'`

## 🔒 Segurança

O projeto implementa múltiplas camadas de segurança:

### Autenticação

- **Verificação obrigatória no banco**: Usuário deve existir na tabela `users`
- **Validação de status**: Usuário deve estar ativo
- **Role do banco**: Role obtido da tabela `users` (fonte de verdade)
- **Cookies seguros**: HttpOnly quando possível, SameSite=Lax, Secure em HTTPS
- **CSRF Protection**: Double-submit cookie pattern

### Autorização

- **Middleware**: Proteção de rotas no nível do Next.js
- **RLS**: Row Level Security no Supabase
- **Validação de API**: Todas as rotas API validam autenticação e permissões

### Dados

- **Sanitização**: Todos os inputs são sanitizados
- **Validação**: Client-side e server-side
- **Logging seguro**: Dados sensíveis são mascarados nos logs

### Rate Limiting

- Proteção contra ataques de força bruta
- Bloqueio temporário após tentativas falhas

## 📊 Monitoramento e Logs

### Sistema de Logging

```typescript
// Exemplo de uso do logger
import { debug, logError } from '@/lib/logger'

debug('Operação realizada', { userId: user.id }, 'ComponentName')
logError('Erro na operação', { error: err }, 'ComponentName')
```

### Métricas Disponíveis

- Performance de carregamento
- Erros e exceções
- Uso de recursos
- Atividade de usuários
- Métricas de negócio
- Web Vitals (via `/api/analytics/web-vitals`)

### Speed Insights

O projeto utiliza `@vercel/speed-insights` para monitoramento de performance em produção.

## 🛠️ Scripts Úteis

### Desenvolvimento

```bash
# Flutter Web
./scripts/dev/run_web.ps1

# Flutter Android
./scripts/dev/run_android.ps1

# Next.js Dev
cd web-app && npm run dev
```

### Deploy

```bash
# Build completo
./scripts/deploy/build_all.ps1

# Deploy web
./scripts/deploy/deploy_web.ps1
```

### Utilitários

```bash
# Instalar dependências
./scripts/setup/install_deps.ps1

# Configurar ambiente
./scripts/setup/setup_env.ps1

# Testar login flow
cd web-app && node scripts/test-login-flow.js

# Associar operador a empresa
cd web-app && node scripts/associate-operator-to-company.js
```

## 📚 Documentação Adicional

- **[Arquitetura](docs/ARCHITECTURE.md)**: Visão detalhada da arquitetura
- **[Painéis](docs/PAINEIS.md)**: Documentação dos painéis
- **[Padrões de Código](docs/CODING_STANDARDS.md)**: Convenções e boas práticas
- **[API Documentation](docs/api/)**: Documentação da API
- **[Guias](docs/guides/)**: Tutoriais e guias específicos
- **[Deploy Guide](docs/deployment/)**: Guias de deploy

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja como você pode ajudar:

### 📋 Como Contribuir

1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/GOLFFOX.git`
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Commit** suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
5. **Push** para a branch: `git push origin feature/nova-funcionalidade`
6. **Abra** um Pull Request

### 📝 Padrões de Commit

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

### 🧪 Antes de Contribuir

```bash
# Execute os testes
flutter test
cd web-app && npm test

# Verifique a formatação
flutter format --set-exit-if-changed .
cd web-app && npm run lint

# Execute a análise
flutter analyze
cd web-app && npm run type-check
```

## 📊 Status do Projeto

- [x] **v1.0**: Sistema base implementado
- [x] **v1.1**: Painéis Admin e Operador
- [x] **v1.2**: Sistema de autenticação completo
- [x] **v1.3**: Multi-tenant implementado
- [x] **v1.4**: Relatórios automatizados
- [ ] **v2.0**: Integração com sistemas de pagamento
- [ ] **v2.1**: IA para otimização de rotas
- [ ] **v2.2**: App para tablets (operadores)
- [ ] **v2.3**: Integração com IoT (sensores de ônibus)
- [ ] **v3.0**: Plataforma white-label

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/pglemos/GOLFFOX/issues)
- **Discussões**: [GitHub Discussions](https://github.com/pglemos/GOLFFOX/discussions)
- **Pull Requests**: [Contribuições](https://github.com/pglemos/GOLFFOX/pulls)
- **Documentação**: Veja a pasta `docs/` do projeto

## 🙏 Agradecimentos

- Equipe Flutter e Dart
- Comunidade Next.js
- Supabase pela infraestrutura
- Todos os contribuidores do projeto

---

**Desenvolvido com ❤️ pela equipe GolfFox**

*Para mais informações, visite nossa [documentação completa](docs/) ou entre em contato conosco.*
