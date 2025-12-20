# Painéis Web - GOLF FOX

## Visão Geral

O sistema GOLF FOX possui 3 painéis web independentes, todos hospedados no mesmo projeto Vercel mas com rotas e permissões distintas.

## Painéis Disponíveis

### 1. Painel Administrativo (`/admin`)

**Acesso**: Apenas usuários com role `admin`

**URL**: https://golffox.vercel.app/admin

#### Funcionalidades

- **Dashboard**: Visão geral do sistema com KPIs e estatísticas
- **Mapa**: Visualização da frota em tempo real no mapa
- **Rotas**: Gerenciamento completo de rotas e itinerários
- **Veículos**: CRUD completo de veículos, manutenção e checklist
- **Motoristas**: Cadastro, documentos e ranking de motoristas
- **Empresas**: Gerenciamento de empresas operadoras
- **Permissões**: Controle de acesso e papéis de usuários
- **Socorro**: Despache de ocorrências e emergências
- **Alertas**: Notificações e alertas do sistema
- **Relatórios**: Análises e exportação (PDF/Excel/CSV)
- **Custos**: Gestão financeira e custos operacionais
- **Ajuda & Suporte**: Central de ajuda

#### Menu Lateral

12 itens de navegação com animações premium.

### 2. Painel do Operador (`/operador`)

**Acesso**: Usuários com role `operador` ou `admin`

**URL**: https://golffox.vercel.app/operador

#### Funcionalidades

- **Dashboard**: Visão geral das viagens da empresa
  - Total de viagens
  - Viagens em andamento
  - Viagens concluídas
  - Lista de viagens com filtros
  
- **Funcionários**: Portal do Operador
  - Lista de funcionários da empresa
  - Busca e filtros
  
- **Rotas**: Rotas atribuídas à empresa
  - Visualização de rotas
  - Status das rotas
  
- **Alertas**: Alertas específicos do operador
  - Filtros por tipo (erro, aviso, info)
  - Busca
  
- **Ajuda**: Central de ajuda
  - FAQ
  - Suporte WhatsApp
  - Documentação
  - Status do sistema

#### Menu Lateral

5 itens focados nas necessidades do operador.

### 3. Painel da Transportadora (`/transportadora`)

**Acesso**: Usuários com role `transportadora` ou `admin`

**URL**: https://golffox.vercel.app/transportadora

#### Funcionalidades

- **Dashboard**: Gestão de frota
  - Total da frota
  - Veículos em rota
  - Motoristas ativos
  - Veículos atrasados
  - Visualização do mapa da frota
  - Lista de motoristas ativos
  - Tabela de status da frota

- **Mapa**: Mapa da frota em tempo real
  - Visualização de todos os veículos
  - Integração com rotas
  - Zoom e navegação

- **Veículos**: Gestão da frota
  - Lista de veículos da transportadora
  - Informações detalhadas
  - Link para visualização no mapa

- **Motoristas**: Motoristas da transportadora
  - Lista de motoristas
  - Informações de contato
  - Link para ranking

- **Alertas**: Alertas específicos
  - Notificações da transportadora
  - Filtros e busca

- **Relatórios**: Relatórios da transportadora
  - Frota em uso
  - Performance de motoristas
  - Viagens realizadas
  - Exportação (CSV/Excel/PDF)

- **Ajuda**: Central de ajuda
  - FAQ específico
  - Suporte
  - Documentação

#### Menu Lateral

7 itens focados na gestão de frota e operação.

## Permissões por Role

### Admin
- ✅ Acesso total a todos os painéis
- ✅ Todas as funcionalidades administrativas
- ✅ Gerenciamento de usuários e permissões

### Operator
- ✅ Acesso ao painel `/operador`
- ✅ Visualização de dados da empresa
- ✅ Gerenciamento de funcionários
- ❌ Bloqueado em `/admin`
- ❌ Bloqueado em `/transportadora`

### Carrier
- ✅ Acesso ao painel `/transportadora`
- ✅ Gestão da própria frota
- ✅ Relatórios da transportadora
- ❌ Bloqueado em `/admin`
- ❌ Bloqueado em `/operador`

### Driver (Motorista)
- ❌ Sem acesso aos painéis web (usa app mobile)
- ✅ Acesso ao app mobile de motorista

### Passenger (Passageiro)
- ❌ Sem acesso aos painéis web (usa app mobile)
- ✅ Acesso ao app mobile de passageiro

## Fluxo de Navegação

### Login

1. Usuário acessa `/` ou `/login`
2. Faz login com email/senha
3. Sistema verifica role no Supabase
4. Redireciona automaticamente:
   - `admin` → `/admin`
   - `operador` → `/operador`
   - `transportadora` → `/transportadora`
   - Outros → `/login` (sem acesso)

### Middleware de Proteção

Todas as rotas protegidas são validadas pelo `middleware.ts`:

- Verifica sessão no Supabase
- Valida role do usuário
- Redireciona não autorizados para `/unauthorized`
- Redireciona não autenticados para `/login?next=/...`

### Navegação Entre Painéis

- Cada painel tem seu próprio menu lateral
- O menu é adaptado automaticamente baseado na rota
- Topbar mostra branding específico do painel
- URLs são preservadas entre navegações

## Dados e Integração

### Supabase

Todos os painéis usam o **mesmo projeto Supabase**:
- Conexão via `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- RLS (Row Level Security) filtra dados por role e empresa
- Service Role usado apenas em operações administrativas server-side

### Filtros por Empresa/Transportadora

- **operador**: Filtra dados por `company_id`
- **transportadora**: Filtra dados por `carrier_id`
- **Admin**: Acessa todos os dados (sem filtros)

### Dados em Tempo Real

- Mapa atualiza posições via `driver_positions`
- Alertas chegam via `gf_notifications`
- Dashboard atualiza KPIs via views do Supabase

## Design e UX

Todos os painéis compartilham:
- Layout premium v42
- Topbar fixa de 72px (desktop) / 74px (mobile)
- Sidebar animada de 280px
- AppShell com max-width 1600px e padding 24px
- Animações Framer Motion
- Tema claro (não escuro)
- Design responsivo
- Cores e branding consistentes

Diferenças:
- Branding no topbar (Admin • Premium | Operador | Transportadora)
- Menus laterais específicos
- Funcionalidades por painel

## Preparação para Mobile

Os apps mobile (Motorista/Passageiro) se conectam diretamente ao Supabase:

- **Não precisam** de backend separado na Vercel
- Usam as mesmas tabelas e RPCs
- Autenticação via Supabase Auth
- Dados filtrados por RLS

Tabelas/RPCs usados pelos apps:
- `driver_positions` - Posições GPS
- `gf_notifications` - Push notifications
- `rpc_validate_boarding` - Validação NFC/QR
- `gf_map_snapshot_full` - Snapshots do mapa
- `rpc_generate_route_stops` - Geração de pontos

