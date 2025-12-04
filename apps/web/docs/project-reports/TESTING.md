# Guia de Testes - GolfFox

Este documento descreve como configurar e executar testes no projeto GolfFox usando TestSprite.

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 22 ou superior)
2. **Supabase** configurado com projeto criado
3. **Variáveis de ambiente** configuradas no `.env.local`
4. **Servidor Next.js** rodando na porta 3000

## 🚀 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha com seus valores:

```bash
cp .env.example .env.local
```

Edite `.env.local` e configure:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
CRON_SECRET=seu_secret_aleatorio_seguro
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_google_maps
```

### 2. Executar Migrations do Banco de Dados

⚠️ **IMPORTANTE**: As migrations devem ser executadas manualmente no Supabase SQL Editor.

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em **SQL Editor**
4. Abra o arquivo `database/migrations/001_initial_schema.sql`
5. Copie todo o conteúdo e execute no SQL Editor

**Ou** execute via linha de comando (se tiver `DATABASE_URL` configurado):

```bash
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
```

### 3. Executar Seeds de Dados

Execute o script master de setup que executa todos os seeds em ordem:

```bash
node scripts/setup-test-environment.js
```

Este script executa:
- ✅ Verificação de variáveis de ambiente
- ✅ Seed de empresas de teste
- ✅ Seed de usuários de teste (admin, operator, passenger)
- ✅ Seed de categorias de custo

**Ou** execute os seeds individualmente:

```bash
# Seed de empresas
node scripts/seed-companies.js

# Seed de usuários
node scripts/seed-users.js

# Seed de categorias de custo
node scripts/seed-cost-categories.js
```

### 4. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor deve estar rodando em `http://localhost:3000`

## 🧪 Executando Testes com TestSprite

### Executar Todos os Testes

```bash
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute
```

### Re-executar Testes Existentes

```bash
npx @testsprite/testsprite-mcp@latest reRunTests
```

### Executar Testes Específicos

```bash
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute --testIds ["TC001", "TC002"]
```

## 📊 Testes Implementados

### TC001: User Login Endpoint Validation
- **Endpoint**: `POST /api/auth/login`
- **Status**: ✅ Passando
- **Valida**: Autenticação de usuários

### TC002: Vehicle Deletion or Archival with Trip Validation
- **Endpoint**: `DELETE /api/admin/vehicles/[vehicleId]`
- **Status**: ⚠️ Requer endpoint de trips
- **Valida**: Exclusão/arquivamento de veículos com validação de viagens

### TC003: Generate Optimized Route Stops
- **Endpoint**: `POST /api/admin/generate-stops`
- **Status**: ✅ Passando
- **Valida**: Geração de paradas otimizadas

### TC004: Create New Operator User
- **Endpoint**: `POST /api/admin/create-operator`
- **Status**: ⚠️ Requer endpoint de companies
- **Valida**: Criação de usuários operadores

### TC005: Manual Cost Entry Creation and Retrieval
- **Endpoint**: `POST /api/costs/manual`, `GET /api/costs/manual`
- **Status**: ⚠️ Requer tabela gf_cost_categories
- **Valida**: Criação e consulta de custos manuais

### TC006: Create Employee as Operator
- **Endpoint**: `POST /api/operator/create-employee`
- **Status**: ⚠️ Requer migrations e seeds
- **Valida**: Criação de funcionários por operadores

### TC007: Optimize Route for Operator
- **Endpoint**: `POST /api/operator/optimize-route`
- **Status**: ⚠️ Requer usuário operator de teste
- **Valida**: Otimização de rotas para operadores

### TC008: Generate Report on Demand
- **Endpoint**: `POST /api/reports/run`
- **Status**: ⚠️ Requer views de relatórios
- **Valida**: Geração de relatórios em múltiplos formatos

### TC009: Cron Job to Dispatch Scheduled Reports
- **Endpoint**: `GET /api/cron/dispatch-reports`, `POST /api/cron/dispatch-reports`
- **Status**: ⚠️ Requer CRON_SECRET configurado
- **Valida**: Job agendado de envio de relatórios

### TC010: System Health Check Endpoint
- **Endpoint**: `GET /api/health`
- **Status**: ✅ Passando
- **Valida**: Health check do sistema

## 🔧 Troubleshooting

### Erro: "Tabela não existe"

**Solução**: Execute as migrations manualmente no Supabase SQL Editor.

### Erro: "Variáveis de ambiente não configuradas"

**Solução**: 
1. Verifique se o arquivo `.env.local` existe
2. Verifique se todas as variáveis obrigatórias estão configuradas
3. Reinicie o servidor após alterar variáveis de ambiente

### Erro: "401 Unauthorized" nos testes

**Solução**: 
1. Verifique se os usuários de teste foram criados: `node scripts/seed-users.js`
2. Verifique as credenciais no arquivo de teste
3. Verifique se o servidor está rodando

### Erro: "CRON_SECRET not configured"

**Solução**: 
1. Adicione `CRON_SECRET` no `.env.local`
2. Use uma string aleatória longa e segura
3. Reinicie o servidor

### Erro: "View não encontrada" (TC008)

**Solução**: 
- As views de relatórios (`v_reports_*`) precisam ser criadas no banco
- Execute as migrations de views (se disponíveis)
- Ou crie as views manualmente no Supabase SQL Editor

### Testes falhando com 404

**Solução**: 
1. Verifique se o servidor está rodando na porta 3000
2. Verifique se os endpoints estão corretos
3. Verifique os logs do servidor para mais detalhes

## 📝 Credenciais de Teste

Após executar o seed de usuários, você terá:

- **Admin**: `golffox@admin.com` / `senha123`
- **Operator**: `operator@test.com` / `senha123`
- **Passenger**: `passenger@test.com` / `senha123`

## 🎯 Meta de Taxa de Sucesso

- **Atual**: 30% (3/10 testes)
- **Após Migrations**: 70% (7/10 testes)
- **Após Endpoints**: 90% (9/10 testes)
- **Meta Final**: 100% (10/10 testes)

## 📚 Recursos Adicionais

- **TestSprite Dashboard**: https://www.testsprite.com/dashboard
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique os logs do TestSprite
3. Consulte a documentação do TestSprite
4. Abra uma issue no repositório do projeto

---

**Última atualização**: 2025-11-11

