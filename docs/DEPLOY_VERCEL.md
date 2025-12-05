# Deploy na Vercel - GOLF FOX

## Informações do Projeto

- **Project URL**: https://vercel.com/synvolt/golffox
- **Project ID**: `prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m`
- **Team ID**: `team_9kUTSaoIkwnAVxy9nXMcAnej`
- **Domain**: https://golffox.vercel.app
- **OIDC URL**: https://oidc.vercel.com/syvolt

## Visão Geral

O projeto GOLF FOX é um sistema de gestão de transporte que consiste em:

1. **Web App** (Next.js 16) - 3 painéis:
   - `/admin` - Painel Administrativo
   - `/operator` - Painel do Operador
   - `/carrier` - Painel da Transportadora

2. **Mobile Apps** (Flutter) - Preparados para integração:
   - App Motorista
   - App Passageiro

Todos os painéis e apps compartilham o mesmo projeto Supabase.

## Pré-requisitos

- Conta Vercel com acesso ao projeto `golffox`
- Node.js 22.x ou superior
- npm 9.0.0 ou superior
- Acesso ao projeto Supabase

## Passo a Passo de Deploy

### 1. Preparar o Repositório

O projeto Next.js está localizado em `/web-app`. Certifique-se de que:
- Todos os arquivos estão commitados
- O `package.json` está atualizado
- Não há erros de build (`npm run build` deve passar)

### 2. Conectar Projeto na Vercel

Se ainda não estiver conectado:

1. Acesse https://vercel.com/synvolt/golffox
2. Vá em **Settings** → **General**
3. Verifique se o **Root Directory** está como `.` (raiz) ou `/web-app` conforme necessário
4. Se o projeto estiver na raiz, deixe como `.`
5. Se o projeto estiver em `/web-app`, configure:
   - **Root Directory**: `web-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3. Configurar Variáveis de Ambiente

Acesse **Settings** → **Environment Variables** e adicione:

#### Variáveis Obrigatórias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU

# Supabase Service Role (apenas Production/Preview)
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

**Importante**: 
- `NEXT_PUBLIC_*` → Disponível no cliente e servidor
- `SUPABASE_SERVICE_ROLE` → Apenas em Production e Preview (NUNCA em Development)
- Selecione os ambientes corretos ao adicionar cada variável

### 4. Configurar Build

No arquivo `vercel.json` (ou nas configurações da Vercel):

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

Se o projeto estiver em `/web-app`, ajuste os comandos:
- **Root Directory**: `web-app`
- **Build Command**: `cd web-app && npm run build`
- **Output Directory**: `web-app/.next`

### 5. Fazer Deploy

#### Opção 1: Via Git (Recomendado)

1. Faça push para o repositório conectado:
   ```bash
   git add .
   git commit -m "Deploy para Vercel"
   git push origin main
   ```

2. A Vercel detectará automaticamente e iniciará o build

#### Opção 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
cd web-app
vercel --prod
```

### 6. Verificar Deploy

Após o deploy, acesse:

- **Admin**: https://golffox.vercel.app/admin
- **Operator**: https://golffox.vercel.app/operator
- **Carrier**: https://golffox.vercel.app/carrier

## Comando de Build

O build é executado automaticamente pela Vercel, mas pode ser testado localmente:

```bash
cd web-app
npm install
npm run build
```

Se o build passar localmente, deve passar na Vercel.

## Testes Pós-Deploy

### 1. Testar Autenticação

- Acesse `/login`
- Faça login com conta de teste:
  - Admin: `golffox@admin.com` / `senha123`
  - Operator: `operador@empresa.com` / `senha123`
  - Carrier: `transportadora@trans.com` / `senha123`

### 2. Testar Permissões

- Admin deve conseguir acessar `/admin`
- Operator deve conseguir acessar `/operator` mas ser bloqueado em `/admin`
- Carrier deve conseguir acessar `/carrier` mas ser bloqueado em `/admin`

### 3. Testar Funcionalidades

- Mapa deve carregar (verificar Google Maps API)
- Dados devem vir do Supabase (não mock)
- Navegação entre páginas deve funcionar
- Sidebar deve mostrar menus corretos por painel

## Integração com Apps Mobile

Os apps mobile (Motorista e Passageiro) usam o **mesmo projeto Supabase**, portanto:

- Não é necessário criar backend separado na Vercel
- Os apps conectam diretamente ao Supabase
- Tabelas/RPCs usados pelos apps:
  - `driver_positions` - Posições em tempo real
  - `gf_notifications` - Notificações push
  - `rpc_validate_boarding` - Validação de embarque (NFC/QR)
  - `gf_map_snapshot_full` - Snapshots do mapa
  - `rpc_generate_route_stops` - Geração de pontos de rota

## Aliases de Domínio (Opcional)

Se desejar separar os painéis em subdomínios:

1. Acesse **Settings** → **Domains**
2. Adicione domínios:
   - `admin.golffox.vercel.app` → `/admin`
   - `operador.golffox.vercel.app` → `/operator`
   - `transportadora.golffox.vercel.app` → `/carrier`

Ou configure via `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/",
      "destination": "/admin",
      "permanent": false
    }
  ]
}
```

## Troubleshooting

### Build Falha

1. Verifique logs na Vercel Dashboard
2. Execute `npm run build` localmente
3. Verifique se todas as dependências estão no `package.json`
4. Verifique imports e sintaxe TypeScript

### Variáveis de Ambiente Não Funcionam

1. Verifique se estão configuradas para o ambiente correto (Production/Preview)
2. Reinicie o deployment após adicionar novas variáveis
3. Verifique se o nome da variável está correto (case-sensitive)

### Middleware Não Funciona

1. Verifique se `middleware.ts` está na raiz de `/web-app`
2. Verifique logs no console do navegador
3. Teste autenticação no Supabase diretamente

### Mapa Não Carrega

1. Verifique `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Verifique se a API do Google Maps está habilitada
3. Verifique limites de quota da API

## Suporte

Para problemas específicos, consulte:
- [docs/TROUBLESHOOTING.md](/docs/TROUBLESHOOTING.md)
- [docs/PAINEIS.md](/docs/PAINEIS.md)

