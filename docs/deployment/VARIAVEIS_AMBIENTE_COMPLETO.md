# 📋 Guia Completo de Variáveis de Ambiente - GOLFFOX

Este documento lista **todas** as variáveis de ambiente necessárias para o projeto GOLFFOX, organizadas por categoria e com explicações detalhadas.

## 📑 Índice

1. [Variáveis Obrigatórias](#-variáveis-obrigatórias)
2. [Supabase](#-supabase)
3. [Google Maps](#️-google-maps)
4. [Sentry](#-sentry)
5. [Email (Resend)](#-email-resend)
6. [Rate Limiting (Upstash)](#-rate-limiting-upstash)
7. [Cron Jobs](#-cron-jobs)
8. [PostgreSQL](#-postgresql)
9. [Aplicação](#-aplicação)
10. [Autenticação](#-autenticação)
11. [Vercel (Automáticas)](#-vercel-automáticas)

---

## ⚠️ Variáveis Obrigatórias

Estas variáveis **DEVEM** ser configuradas para que a aplicação funcione:

```bash
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps (obrigatório)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Cron Secret (obrigatório para produção)
CRON_SECRET=seu-secret-aleatorio-aqui-minimo-32-caracteres
```

---

## 🔵 Supabase

### Obrigatórias

| Variável | Tipo | Descrição | Onde Obter |
|----------|------|-----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL do projeto Supabase | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Chave anônima (anon key) - exposta ao cliente | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) > Settings > API > Project API keys > anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Sensitive | Chave de serviço - **NUNCA** expor ao cliente | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) > Settings > API > Project API keys > service_role |

### Alternativas (Compatibilidade)

Essas variáveis são alternativas aceitas pelo código como fallback:

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `SUPABASE_URL` | Server | URL alternativa (sem `NEXT_PUBLIC_`) |
| `SUPABASE_ANON_KEY` | Server | Chave anônima alternativa |
| `SUPABASE_SERVICE_ROLE` | Sensitive | Service role alternativa (sem `_KEY`) |

### PostgreSQL (Desenvolvimento Local)

Apenas necessárias se conectando diretamente ao PostgreSQL fora do Supabase:

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `POSTGRES_URL` | Sensitive | URL de conexão PostgreSQL (pooling) |
| `POSTGRES_PRISMA_URL` | Sensitive | URL de conexão PostgreSQL (Prisma) |
| `POSTGRES_URL_NON_POOLING` | Sensitive | URL de conexão PostgreSQL (non-pooling) |
| `POSTGRES_USER` | Server | Usuário PostgreSQL (padrão: `postgres`) |
| `POSTGRES_PASSWORD` | Sensitive | Senha PostgreSQL |
| `POSTGRES_HOST` | Server | Host PostgreSQL |
| `POSTGRES_DATABASE` | Server | Nome do banco (padrão: `postgres`) |
| `SUPABASE_JWT_SECRET` | Sensitive | JWT Secret para validação de tokens |

### Exemplo de Valores

```bash
# Obrigatórias
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A
```

---

## 🗺️ Google Maps

### Obrigatória

| Variável | Tipo | Descrição | Onde Obter |
|----------|------|-----------|------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | API Key do Google Maps - exposta ao cliente | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

### Alternativa (Compatibilidade)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `GOOGLE_MAPS_API_KEY` | Public | Alternativa (sem `NEXT_PUBLIC_`) |

### APIs Necessárias

Na Google Cloud Console, habilite estas APIs para a API Key:

- ✅ Maps JavaScript API
- ✅ Geocoding API
- ✅ Directions API
- ✅ Places API (opcional, para autocomplete de endereços)

### Restrições Recomendadas

Configure restrições de domínio na API Key:

- **Application restrictions**: HTTP referrers
- **Website restrictions**: 
  - `https://golffox.vercel.app/*`
  - `https://*.vercel.app/*` (para previews)
  - `http://localhost:3000/*` (para desenvolvimento)

### Exemplo de Valor

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

---

## 🔴 Sentry

### Opcional mas Recomendado

Monitoramento de erros e performance. Se não configurar, a aplicação funcionará normalmente mas sem monitoramento.

| Variável | Tipo | Descrição | Onde Obter |
|----------|------|-----------|------------|
| `SENTRY_DSN` | Server | DSN do Sentry (server-side) | [Sentry Dashboard](https://sentry.io/settings/organizations/.../projects/.../keys) |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | DSN do Sentry (client-side) - exposto ao cliente | [Sentry Dashboard](https://sentry.io/settings/organizations/.../projects/.../keys) |
| `SENTRY_TRACES_SAMPLE_RATE` | Server | Taxa de amostragem de traces (0.0 a 1.0) | Configurar (padrão: `0.2` = 20%) |
| `SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | Server | Taxa de amostragem de replay de sessões | Configurar (padrão: `0.05` = 5%) |
| `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | Server | Taxa de amostragem de replay em erros | Configurar (padrão: `0.5` = 50%) |
| `SENTRY_TRACES_RATE` | Server | Taxa de traces alternativa (usada em instrumentation.ts) | Configurar (padrão: `0.2`) |
| `SENTRY_ORG` | Server | Nome da organização Sentry | [Sentry Dashboard](https://sentry.io/settings/organizations/) |
| `SENTRY_PROJECT` | Server | Nome do projeto Sentry | [Sentry Dashboard](https://sentry.io/settings/organizations/.../projects/) |
| `SENTRY_AUTH_TOKEN` | Sensitive | Token de autenticação Sentry (para build time) | [Sentry Dashboard](https://sentry.io/settings/account/api/auth-tokens/) |

### Taxas Recomendadas

**Development:**
- `SENTRY_TRACES_SAMPLE_RATE=1.0` (100% - captura tudo)

**Production:**
- `SENTRY_TRACES_SAMPLE_RATE=0.2` (20% - suficiente para monitoramento)
- `SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.05` (5% - grava poucas sessões)
- `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=0.5` (50% - grava metade das sessões com erro)

### Exemplo de Valores

```bash
NEXT_PUBLIC_SENTRY_DSN=https://097523959da2cf11865ab78e4b6730a1@o4510370625880064.ingest.us.sentry.io/4510370638790656
SENTRY_DSN=https://097523959da2cf11865ab78e4b6730a1@o4510370625880064.ingest.us.sentry.io/4510370638790656
SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.05
SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=0.5
SENTRY_ORG=synvolt
SENTRY_PROJECT=golffox-web
SENTRY_AUTH_TOKEN=73d06d441ebfe82b0d6f0422bec531f7900374ed1337e8d0657d9c0fec9b4d35
```

---

## 📧 Email (Resend)

### Opcional

Necessário apenas para envio automático de relatórios por email. Se não configurar, os relatórios ainda podem ser gerados manualmente.

| Variável | Tipo | Descrição | Onde Obter |
|----------|------|-----------|------------|
| `RESEND_API_KEY` | Sensitive | API Key do Resend para envio de emails | [Resend Dashboard](https://resend.com/api-keys) |
| `REPORTS_FROM_EMAIL` | Server | Email remetente para relatórios (deve estar verificado no Resend) | Configurar (ex: `noreply@seu-dominio.com`) |
| `REPORTS_BCC` | Server | Email BCC para cópias de relatórios (opcional) | Configurar (ex: `admin@seu-dominio.com`) |

### SMTP Alternativo (Opcional)

Se preferir usar SMTP em vez de Resend:

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `SMTP_HOST` | Server | Host SMTP (ex: `smtp.gmail.com`) |
| `SMTP_PORT` | Server | Porta SMTP (ex: `587`) |
| `SMTP_USER` | Server | Usuário SMTP |
| `SMTP_PASS` | Sensitive | Senha SMTP |

### Exemplo de Valores

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REPORTS_FROM_EMAIL=noreply@golffox.com.br
REPORTS_BCC=admin@golffox.com.br
```

---

## ⚡ Rate Limiting (Upstash)

### Opcional mas Recomendado para Produção

Proteção contra abuso de APIs. Se não configurar, o rate limiting será desabilitado.

| Variável | Tipo | Descrição | Onde Obter |
|----------|------|-----------|------------|
| `UPSTASH_REDIS_REST_URL` | Server | URL da API REST do Upstash Redis | [Upstash Console](https://console.upstash.com/) > Redis Database > REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Sensitive | Token de autenticação do Upstash Redis | [Upstash Console](https://console.upstash.com/) > Redis Database > REST API |

### Criando Database Upstash

1. Acesse [Upstash Console](https://console.upstash.com/)
2. Crie um novo Redis Database
3. Escolha a região mais próxima (ex: `us-east-1`)
4. Copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

### Exemplo de Valores

```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⏰ Cron Jobs

### Obrigatório para Produção

Secret para proteger endpoints de cron jobs executados pelo Vercel Cron.

| Variável | Tipo | Descrição | Gerar |
|----------|------|-----------|-------|
| `CRON_SECRET` | Sensitive | Secret para proteger endpoints de cron | Use um valor aleatório e seguro (mínimo 32 caracteres) |

### Endpoints Protegidos

- `/api/cron/refresh-kpis` - Atualiza KPIs (executa diariamente às 3h)
- `/api/cron/refresh-costs-mv` - Atualiza materialized views de custos (executa diariamente às 2h)
- `/api/cron/dispatch-reports` - Despacha relatórios agendados (executa toda segunda-feira às 8h)

### Gerando um Secret Seguro

**Opção 1: OpenSSL**
```bash
openssl rand -base64 32
```

**Opção 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opção 3: Online**
Use um gerador de senhas seguras (mínimo 32 caracteres, alfanumérico + símbolos)

### Exemplo de Valor

```bash
CRON_SECRET=e830db45672f9a1c0216de1e4783c9b1f2e2588a9553235c4c4ed3c39f643a69336cc823c9147b73
```

---

## 🚀 Aplicação

### Opcionais

| Variável | Tipo | Descrição | Padrão |
|----------|------|-----------|--------|
| `NEXT_PUBLIC_BASE_URL` | Public | URL base da aplicação (usado em links e redirecionamentos) | `http://localhost:3000` |
| `NEXT_PUBLIC_AUTH_ENDPOINT` | Public | Endpoint de autenticação personalizado | `/api/auth/login` |
| `NEXT_PUBLIC_LOGGED_URL` | Public | URL padrão após login bem-sucedido | `/operator` |
| `NEXT_PUBLIC_DISABLE_MIDDLEWARE` | Public | Desabilitar middleware de autenticação (útil para testes) | `false` |

### Banco de Dados (Avançado)

| Variável | Tipo | Descrição | Padrão |
|----------|------|-----------|--------|
| `NEXT_PUBLIC_EMPLOYEE_DB_TABLE` | Public | Nome da tabela de funcionários | `gf_employee_company` |
| `NEXT_PUBLIC_STOPS_DEBOUNCE_MS` | Public | Tempo de debounce para geração de paradas (ms) | `500` |
| `NEXT_PUBLIC_EMPLOYEE_PAGE_SIZE` | Public | Tamanho da página para listagem de funcionários | `200` |
| `NEXT_PUBLIC_REALTIME_RETRIES` | Public | Número de tentativas de reconexão Realtime | `3` |

### Exemplo de Valores

```bash
# Desenvolvimento
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Produção
NEXT_PUBLIC_BASE_URL=https://golffox.vercel.app
```

---

## 🔐 Autenticação

### Opcional

| Variável | Tipo | Descrição | Gerar |
|----------|------|-----------|-------|
| `NEXTAUTH_SECRET` | Sensitive | Secret para assinatura de tokens JWT do NextAuth | Use um valor aleatório e seguro (mínimo 32 caracteres) |

### Gerando um Secret

Use o mesmo método do `CRON_SECRET`:

```bash
openssl rand -base64 32
```

### Exemplo de Valor

```bash
NEXTAUTH_SECRET=golffox-production-secret-2024-change-this
```

⚠️ **Importante**: Use valores diferentes para cada ambiente e **mude o padrão** em produção!

---

## 🌍 Node.js

### Automático (geralmente)

| Variável | Tipo | Descrição | Valores |
|----------|------|-----------|---------|
| `NODE_ENV` | Server | Ambiente de execução | `development`, `production`, `test` |

**Nota**: Geralmente configurado automaticamente pelo Next.js/Vercel. Em desenvolvimento local, pode ser necessário configurar manualmente.

---

## ☁️ Vercel (Automáticas)

### ⚠️ NÃO CONFIGURAR MANUALMENTE

Estas variáveis são configuradas automaticamente pelo Vercel. Você não precisa configurá-las manualmente:

| Variável | Tipo | Descrição | Quando Disponível |
|----------|------|-----------|-------------------|
| `VERCEL` | Server | Indica que está rodando no Vercel | Sempre no Vercel |
| `VERCEL_ENV` | Server | Ambiente Vercel | Sempre no Vercel |
| `VERCEL_URL` | Server | URL da deployment atual | Sempre no Vercel |
| `VERCEL_GIT_COMMIT_SHA` | Server | Hash do commit atual | Sempre no Vercel |

---

## 📝 Resumo Rápido

### ✅ Obrigatórias (Mínimo para funcionar)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_api_key_aqui
CRON_SECRET=seu_secret_aqui
```

### ⭐ Recomendadas (Funcionalidades completas)

```bash
# Sentry (monitoramento)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.us.sentry.io/xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.us.sentry.io/xxxxx

# Rate Limiting (proteção)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui

# Email (relatórios automáticos)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
REPORTS_FROM_EMAIL=noreply@seu-dominio.com
```

---

## 🔒 Segurança

### ⚠️ Variáveis Sensíveis

Marque estas variáveis como **"Sensitive"** no Vercel:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_ROLE`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_PASSWORD`
- `SUPABASE_JWT_SECRET`
- `RESEND_API_KEY`
- `SMTP_PASS`
- `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`
- `NEXTAUTH_SECRET`
- `SENTRY_AUTH_TOKEN`

### 🎯 Variáveis Públicas (Expostas ao Cliente)

Estas variáveis começam com `NEXT_PUBLIC_` e são expostas ao navegador:

- `NEXT_PUBLIC_SUPABASE_URL` ✅ Seguro (apenas URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ Seguro (RLS protege os dados)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ✅ Seguro (restringir por domínio)
- `NEXT_PUBLIC_SENTRY_DSN` ✅ Seguro (apenas para envio de erros)
- `NEXT_PUBLIC_BASE_URL` ✅ Seguro (apenas URL)
- Outras `NEXT_PUBLIC_*`

**NUNCA** exponha variáveis sensíveis com `NEXT_PUBLIC_`!

---

## 🚀 Configuração no Vercel

### Passo a Passo

1. **Acesse o Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Faça login com sua conta

2. **Selecione o Projeto**
   - Nome: `golffox`
   - Username: `synvolt`

3. **Vá para Environment Variables**
   - Settings > Environment Variables

4. **Adicione cada variável**
   - **Name**: Nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Valor da variável (ex: `https://vmoxzesvjcfmrebagcwo.supabase.co`)
   - **Environment**: Selecione quais ambientes aplicar
     - ☑️ Production (para branch `main`)
     - ☑️ Preview (para branches/PRs)
     - ☑️ Development (para desenvolvimento local)

5. **Marque como Sensitive** (se aplicável)
   - Clique no ícone de "olho" para marcar variáveis sensíveis

6. **Salve e Faça Deploy**
   - Clique em "Save" para cada variável
   - Faça um novo deploy para aplicar as mudanças

### Configuração Rápida (Via CLI)

Crie um arquivo `.env.local` localmente:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# ... outras variáveis
```

E use o Vercel CLI para enviar:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... para cada variável
```

Ou envie todas de uma vez (se configurou no `.env.local`):

```bash
vercel env pull .env.local
```

---

## ✅ Checklist de Configuração

Use este checklist para garantir que todas as variáveis estão configuradas:

### Obrigatórias
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `CRON_SECRET`

### Recomendadas
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (monitoramento)
- [ ] `SENTRY_DSN` (monitoramento)
- [ ] `UPSTASH_REDIS_REST_URL` (rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
- [ ] `RESEND_API_KEY` (email)
- [ ] `REPORTS_FROM_EMAIL` (email)

### Opcionais
- [ ] `NEXT_PUBLIC_BASE_URL` (customização)
- [ ] `NEXTAUTH_SECRET` (autenticação)
- [ ] `NODE_ENV` (ambiente - geralmente automático)

---

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Google Maps](https://developers.google.com/maps/documentation)
- [Documentação Sentry](https://docs.sentry.io/)
- [Documentação Resend](https://resend.com/docs)
- [Documentação Upstash](https://docs.upstash.com/)
- [Documentação Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🆘 Troubleshooting

### Erro: "Supabase não configurado"

**Causa**: Variáveis do Supabase não estão configuradas ou incorretas.

**Solução**:
1. Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas
2. Verifique se os valores estão corretos (sem espaços extras)
3. Faça um novo deploy após configurar

### Erro: "Google Maps não carregou"

**Causa**: API Key do Google Maps não configurada ou incorreta.

**Solução**:
1. Verifique se `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` está configurada
2. Verifique se a API Key tem as APIs necessárias habilitadas
3. Verifique se as restrições de domínio estão corretas

### Erro: "Rate limiting desabilitado"

**Causa**: Variáveis do Upstash não configuradas.

**Solução**:
1. Configure `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
2. Ou ignore o aviso (rate limiting será desabilitado)

### Erro: "Resend não configurado"

**Causa**: Variáveis do Resend não configuradas.

**Solução**:
1. Configure `RESEND_API_KEY` e `REPORTS_FROM_EMAIL`
2. Ou ignore (relatórios automáticos por email não funcionarão)

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0

