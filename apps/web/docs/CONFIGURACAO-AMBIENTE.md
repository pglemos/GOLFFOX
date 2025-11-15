# Guia de Configuração de Ambiente - Painel do Operador

## 📋 Variáveis de Ambiente Necessárias

### Vercel Environment Variables

Configure as seguintes variáveis no Vercel Dashboard:

#### Variáveis Obrigatórias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua-chave-google-maps

# Cron Job (CRÍTICO)
CRON_SECRET=seu-secret-aleatorio-aqui
```

#### Variáveis Opcionais (se necessário)

```bash
# Sentry (Observabilidade)
NEXT_PUBLIC_SENTRY_DSN=https://seu-dsn@sentry.io/projeto

# Email (para relatórios agendados)
RESEND_API_KEY=re_seu-key-aqui
# ou
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=usuario@exemplo.com
SMTP_PASS=senha-aqui
```

## 🔐 Configurando CRON_SECRET

### Por que é necessário?

O `CRON_SECRET` protege o endpoint `/api/cron/refresh-kpis` de acesso não autorizado. O Vercel Cron envia este secret no header `Authorization`.

### Como gerar um secret seguro

```bash
# No terminal (Linux/Mac)
openssl rand -base64 32

# Ou use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Ou use um gerador online seguro
# https://randomkeygen.com/
```

### Como configurar no Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Name**: `CRON_SECRET`
   - **Value**: Seu secret gerado
   - **Environment**: Production, Preview, Development (marque todos)
5. Clique em **Save**

### Verificar se está funcionando

O endpoint `/api/cron/refresh-kpis` verifica o secret:

```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

O Vercel Cron automaticamente envia o secret no header quando configurado no `vercel.json`.

## ⚙️ Configuração do Vercel Cron

O `vercel.json` já está configurado:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-kpis",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Isso significa que o cron job roda a cada 5 minutos.

### Verificar logs do cron

1. Acesse o Vercel Dashboard
2. Vá em **Deployments**
3. Selecione um deployment
4. Clique em **Functions** → `/api/cron/refresh-kpis`
5. Veja os logs de execução

## 🔍 Verificação de Variáveis

### Script de Verificação

Crie um arquivo `scripts/check-env.js`:

```javascript
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'CRON_SECRET'
]

console.log('🔍 Verificando variáveis de ambiente...\n')

const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('❌ Variáveis faltando:')
  missing.forEach(key => console.error(`   - ${key}`))
  process.exit(1)
}

console.log('✅ Todas as variáveis obrigatórias estão configuradas!\n')
required.forEach(key => {
  const value = process.env[key]
  const display = key.includes('SECRET') || key.includes('KEY') 
    ? value.substring(0, 8) + '...' 
    : value
  console.log(`   ${key}: ${display}`)
})
```

Execute:
```bash
node scripts/check-env.js
```

## 📝 Checklist de Configuração

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` configurado
- [ ] `CRON_SECRET` gerado e configurado
- [ ] Vercel Cron configurado no `vercel.json`
- [ ] Variáveis testadas localmente
- [ ] Deploy realizado no Vercel
- [ ] Logs do cron verificados

## 🚨 Troubleshooting

### Cron não está rodando

1. Verifique se `CRON_SECRET` está configurado
2. Verifique os logs do deployment
3. Verifique se o `vercel.json` está correto
4. Verifique se o endpoint `/api/cron/refresh-kpis` existe

### Erro 401 no cron endpoint

- Verifique se `CRON_SECRET` está configurado no Vercel
- Verifique se o secret no código corresponde ao do Vercel
- Verifique se o header `Authorization` está sendo enviado corretamente

### KPIs não atualizando

1. Verifique se o cron está rodando (logs)
2. Verifique se `mv_operator_kpis` existe no banco
3. Verifique se há dados nas tabelas base
4. Execute manualmente: `REFRESH MATERIALIZED VIEW mv_operator_kpis;`

## 📚 Referências

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)

