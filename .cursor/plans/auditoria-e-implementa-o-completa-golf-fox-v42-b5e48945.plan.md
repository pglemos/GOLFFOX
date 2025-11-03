<!-- b5e48945-9d86-4c49-8add-430a28a8497d a7547527-cf58-40d1-8e5d-d7614abfd261 -->
# Configurar 3 Painéis Web na Vercel - GOLF FOX

## Objetivo

Configurar o projeto Next.js para rodar na Vercel (golffox.vercel.app) com 3 painéis independentes: `/admin`, `/operator`, `/carrier`, todos usando o mesmo Supabase e preparados para integração mobile.

## Estrutura de Implementação

### 1. Middleware de Autenticação (`web-app/middleware.ts`)

- Criar middleware Next.js que intercepta rotas `/admin/*`, `/operator/*`, `/carrier/*`
- Validar sessão Supabase usando `createMiddlewareClient` ou verificação direta de token
- Regras de autorização:
- `/admin/*` → role = 'admin'
- `/operator/*` → role IN ('operator', 'admin')
- `/carrier/*` → role IN ('carrier', 'admin')
- Redirecionar não autenticados para `/login?next=/...`
- Redirecionar não autorizados para página de acesso negado

### 2. Configuração Vercel (`web-app/vercel.json`)

- Atualizar vercel.json para apontar para pasta `/web-app` se necessário
- Configurar rotas corretas (sem rewrites desnecessários)
- Manter configuração de funções serverless (maxDuration: 30s)

### 3. Layouts e Componentes

#### 3.1 Sidebar Dinâmico (`web-app/components/sidebar.tsx`)

- Adicionar prop `panel?: 'admin' | 'operator' | 'carrier'`
- Menu Admin: 12 itens existentes (Dashboard, Mapa, Rotas, Veículos, Motoristas, Empresas, Permissões, Socorro, Alertas, Relatórios, Custos, Ajuda)
- Menu Operator: Dashboard, Funcionários, Rotas, Alertas, Ajuda
- Menu Carrier: Dashboard, Mapa, Veículos, Motoristas, Alertas, Relatórios, Ajuda
- Manter design premium v42 (280px, animações, tooltips)

#### 3.2 Topbar com Branding (`web-app/components/topbar.tsx`)

- Adicionar prop `panelBranding?: string` ou detectar via `NEXT_PUBLIC_GF_PANEL`
- Exibir "GOLF FOX Admin" | "GOLF FOX Operador" | "GOLF FOX Transportadora"
- Manter 72px de altura, shortcuts e avatar

#### 3.3 AppShell Adaptativo (`web-app/components/app-shell.tsx`)

- Detectar painel atual via `usePathname()` ou prop
- Passar `panel` para Sidebar e `panelBranding` para Topbar
- Manter max-width 1600px e padding 24px

### 4. Páginas por Painel

#### 4.1 Painel Operator (`web-app/app/operator/`)

- `/operator/page.tsx` - Dashboard com KPIs (já existe, melhorar)
- `/operator/funcionarios/page.tsx` - Lista de funcionários/empregados
- `/operator/rotas/page.tsx` - Visualização de rotas
- `/operator/alertas/page.tsx` - Alertas específicos do operador
- `/operator/ajuda/page.tsx` - Central de ajuda

#### 4.2 Painel Carrier (`web-app/app/carrier/`)

- `/carrier/page.tsx` - Dashboard com frota (já existe, melhorar)
- `/carrier/mapa/page.tsx` - Mapa da frota em tempo real
- `/carrier/veiculos/page.tsx` - Lista de veículos da transportadora
- `/carrier/motoristas/page.tsx` - Motoristas da transportadora
- `/carrier/alertas/page.tsx` - Alertas específicos
- `/carrier/relatorios/page.tsx` - Relatórios da transportadora
- `/carrier/ajuda/page.tsx` - Central de ajuda

### 5. Variáveis de Ambiente

- Atualizar `.env.local.example` com:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE` (server-side only)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GF_PANEL` (opcional, para branding)
- Criar arquivo de instruções para configurar na Vercel

### 6. Supabase Server Client (`web-app/lib/supabase-server.ts`)

- Verificar se está correto (já existe)
- Garantir que usa `SUPABASE_SERVICE_ROLE` apenas em rotas server/edge
- Não expor service_role ao client

### 7. Documentação

#### 7.1 `docs/DEPLOY_VERCEL.md`

- Informações do projeto Vercel:
- Project URL: https://vercel.com/synvolt/golffox
- Project ID: prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m
- Team ID: team_9kUTSaoIkwnAVxy9nXMcAnej
- Domain: https://golffox.vercel.app
- Passo a passo de deploy
- Variáveis de ambiente obrigatórias
- Comando de build (`npm run build`)
- Testes pós-deploy

#### 7.2 `docs/PAINEIS.md`

- Descrição de cada painel
- Funcionalidades disponíveis
- Permissões por role
- Fluxo de navegação

#### 7.3 `docs/TROUBLESHOOTING.md`

- Problemas comuns:
- "Mapa não carrega" → falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- "Não loga no admin" → checar middleware + role no Supabase
- "Diferença local x Vercel" → checar env vars na Vercel
- "Erro 500 no build" → verificar logs, checar imports
- Soluções passo a passo

### 8. Integração Mobile (Preparação)

- Documentar na `docs/DEPLOY_VERCEL.md` que:
- Apps mobile usam o mesmo Supabase
- Tabelas/RPCs que os apps usam: `driver_positions`, `gf_notifications`, `rpc_validate_boarding`, `gf_map_snapshot_full`, `rpc_generate_route_stops`
- Não precisa criar backend separado na Vercel

### 9. Validação e Testes

- `npm run build` deve passar sem erros
- Testar rotas protegidas:
- Admin acessa `/admin` ✅
- Operator acessa `/operator` ✅ mas bloqueado em `/admin` ❌
- Carrier acessa `/carrier` ✅ mas bloqueado em `/admin` ❌
- Verificar que dados vêm do Supabase real (não mock)
- Testar middleware em ambiente local antes de deploy

## Arquivos a Criar/Modificar

### Criar:

- `web-app/middleware.ts` (novo)
- `web-app/app/operator/funcionarios/page.tsx`
- `web-app/app/operator/alertas/page.tsx`
- `web-app/app/operator/ajuda/page.tsx`
- `web-app/app/carrier/mapa/page.tsx`
- `web-app/app/carrier/veiculos/page.tsx`
- `web-app/app/carrier/motoristas/page.tsx`
- `web-app/app/carrier/alertas/page.tsx`
- `web-app/app/carrier/relatorios/page.tsx`
- `web-app/app/carrier/ajuda/page.tsx`
- `docs/DEPLOY_VERCEL.md`
- `docs/PAINEIS.md`
- `docs/TROUBLESHOOTING.md`

### Modificar:

- `web-app/vercel.json` (atualizar configuração)
- `web-app/components/sidebar.tsx` (adicionar menus por painel)
- `web-app/components/topbar.tsx` (adicionar branding dinâmico)
- `web-app/components/app-shell.tsx` (detectar painel)
- `web-app/app/operator/page.tsx` (melhorar com dados reais)
- `web-app/app/carrier/page.tsx` (melhorar com dados reais)
- `web-app/lib/supabase-server.ts` (verificar se está correto)

## Ordem de Implementação

1. Criar middleware.ts com validação de roles
2. Atualizar vercel.json
3. Adaptar Sidebar e Topbar para múltiplos painéis
4. Criar/completar páginas do Operator
5. Criar/completar páginas do Carrier
6. Criar documentação completa
7. Testar build local (`npm run build`)
8. Validar estrutura antes de deploy

## Notas Importantes

- Todos os painéis usam o mesmo Supabase project
- Middleware valida roles no Supabase antes de permitir acesso
- Layout premium v42 mantido em todos os painéis
- Preparado para integração com apps mobile (mesmo Supabase)

### To-dos

- [ ] Criar web-app/middleware.ts com validação de sessão Supabase e autorização por role (admin/operator/carrier)
- [ ] Atualizar web-app/vercel.json para configuração correta do projeto
- [ ] Adaptar web-app/components/sidebar.tsx para aceitar prop panel e exibir menus diferentes (admin/operator/carrier)
- [ ] Adaptar web-app/components/topbar.tsx para exibir branding dinâmico por painel
- [ ] Atualizar web-app/components/app-shell.tsx para detectar painel e passar props corretas
- [ ] Criar/completar páginas do painel Operator: funcionarios, alertas, ajuda
- [ ] Criar/completar páginas do painel Carrier: mapa, veiculos, motoristas, alertas, relatorios, ajuda
- [ ] Melhorar web-app/app/operator/page.tsx com dados reais do Supabase
- [ ] Melhorar web-app/app/carrier/page.tsx com dados reais do Supabase
- [ ] Verificar e corrigir web-app/lib/supabase-server.ts se necessário
- [ ] Criar/atualizar .env.local.example com todas as variáveis necessárias
- [ ] Criar docs/DEPLOY_VERCEL.md com informações do projeto, passo a passo e variáveis de ambiente
- [ ] Criar docs/PAINEIS.md explicando funcionalidades de cada painel
- [ ] Criar docs/TROUBLESHOOTING.md com problemas comuns e soluções
- [ ] Executar npm run build localmente para validar antes de deploy