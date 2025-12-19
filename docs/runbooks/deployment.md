# Runbook: Deployment - GolfFox

**Última atualização:** 2025-01-XX

---

## 📋 Visão Geral

Este runbook descreve o processo de deploy do GolfFox para produção na Vercel.

---

## 🚀 Processo de Deploy

### Pré-requisitos

- [ ] Código revisado e aprovado em PR
- [ ] Testes passando no CI
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations aplicadas (se houver novas)

### Deploy Automático (Recomendado)

1. **Merge para `main`**
   - Push para `main` dispara deploy automático
   - Vercel detecta mudanças e faz build
   - Deploy acontece automaticamente

2. **Verificar Deploy**
   - Acessar [Vercel Dashboard](https://vercel.com/dashboard)
   - Verificar status do deploy
   - Verificar logs de build

3. **Smoke Tests**
   - [ ] Login funciona
   - [ ] Dashboard carrega
   - [ ] APIs respondem corretamente

### Deploy Manual

```bash
# 1. Instalar dependências
npm install

# 2. Build local (testar)
cd apps/web
npm run build

# 3. Deploy via Vercel CLI
vercel --prod
```

---

## 🔧 Variáveis de Ambiente

### Obrigatórias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Opcionais

- `ADMIN_SECRET` - Secret para rotas perigosas
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking (Sentry)

### Configurar no Vercel

1. Acessar [Vercel Dashboard](https://vercel.com/dashboard)
2. Projeto → Settings → Environment Variables
3. Adicionar variáveis
4. Selecionar ambientes (Production, Preview, Development)

---

## 🗄️ Migrations

### Antes do Deploy

Se houver novas migrations:

1. **Aplicar no Supabase**
   ```sql
   -- Via Supabase Dashboard > SQL Editor
   -- Executar migration em ordem
   ```

2. **Verificar Aplicação**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version;
   ```

3. **Testar Localmente**
   - Aplicar migration localmente
   - Testar funcionalidades afetadas

### Após o Deploy

- [ ] Verificar que migrations foram aplicadas
- [ ] Testar funcionalidades que dependem das migrations

---

## 🧪 Verificação Pós-Deploy

### Checklist

- [ ] Build completou sem erros
- [ ] Site está acessível
- [ ] Login funciona
- [ ] APIs respondem (testar algumas rotas)
- [ ] Dashboard carrega dados
- [ ] Sem erros no console do navegador
- [ ] Sem erros nos logs do Vercel

### Testes Rápidos

```bash
# Health check
curl https://golffox.vercel.app/api/health

# Verificar build
curl -I https://golffox.vercel.app
```

---

## 🔄 Rollback

### Se algo der errado:

1. **Via Vercel Dashboard**
   - Acessar Deployments
   - Encontrar deploy anterior estável
   - Clicar em "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback [deployment-url]
   ```

### Após Rollback

- [ ] Verificar que site voltou ao normal
- [ ] Investigar causa do problema
- [ ] Corrigir e fazer novo deploy

---

## 📊 Monitoramento

### Logs

- **Vercel Logs:** Dashboard → Projeto → Logs
- **Supabase Logs:** Dashboard → Logs
- **Error Tracking:** Sentry (se configurado)

### Métricas

- **Vercel Analytics:** Dashboard → Analytics
- **Web Vitals:** Dashboard → Speed Insights

---

## ⚠️ Problemas Comuns

### Build Falha

1. Verificar logs de build no Vercel
2. Verificar erros TypeScript (se `ignoreBuildErrors: false`)
3. Verificar dependências faltantes
4. Testar build local: `npm run build`

### Erro 500 em Produção

1. Verificar logs do Vercel
2. Verificar variáveis de ambiente
3. Verificar conexão com Supabase
4. Verificar rate limiting (Upstash)

### Migrations Não Aplicadas

1. Aplicar manualmente no Supabase Dashboard
2. Verificar ordem de execução
3. Verificar dependências entre migrations

---

**Última atualização:** 2025-01-XX
