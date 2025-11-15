# Configuração de Variáveis de Ambiente no Vercel

Este documento descreve como configurar as variáveis de ambiente necessárias para o projeto GolfFox no Vercel.

## Variáveis Requeridas

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (service_role) do Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Chave da API do Google Maps | `AIzaSy...` |
| `CRON_SECRET` | Secret para autenticar cron jobs | `hex_string_64_chars` |

### Opcionais

| Variável | Descrição | Quando Usar |
|----------|-----------|-------------|
| `RESEND_API_KEY` | Chave da API Resend para envio de emails | Se usar relatórios por email |
| `REPORTS_FROM_EMAIL` | Email remetente para relatórios | Se usar Resend |
| `REPORTS_BCC` | Email BCC para relatórios | Se usar Resend |

## Como Configurar

### Via CLI do Vercel

1. **Autenticar:**
   ```bash
   vercel login
   ```

2. **Selecionar escopo do time:**
   ```bash
   vercel switch --scope team_9kUTSaoIkwnAVxy9nXMcAnej
   ```

3. **Listar variáveis existentes:**
   ```bash
   vercel env ls golffox
   ```

4. **Adicionar variável para Production:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   # Cole o valor quando solicitado
   ```

5. **Adicionar variável para Preview:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL preview
   # Cole o valor quando solicitado
   ```

6. **Adicionar variável para Development:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL development
   # Cole o valor quando solicitado
   ```

### Via Dashboard Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto `golffox`
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Preencha:
   - **Key:** Nome da variável
   - **Value:** Valor da variável
   - **Environment:** Selecione Production, Preview, Development ou All
6. Clique em **Save**

## Gerar CRON_SECRET

O `CRON_SECRET` é usado para autenticar requisições dos cron jobs do Vercel. Gere um novo secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use o script:

```bash
node scripts/check-vercel-env.js
```

O script irá gerar automaticamente um CRON_SECRET se não encontrar um configurado.

**Importante:** Adicione o mesmo `CRON_SECRET` em:
- Production
- Preview

Isso garante que os cron jobs funcionem em ambos os ambientes.

## Verificar Configuração

### Via Script

```bash
node scripts/check-vercel-env.js
```

O script irá:
- Verificar autenticação com Vercel CLI
- Listar todas as variáveis de ambiente
- Identificar variáveis faltantes
- Gerar CRON_SECRET se necessário

### Via Dashboard

1. Acesse **Settings** → **Environment Variables**
2. Verifique se todas as variáveis requeridas estão presentes
3. Verifique se estão configuradas para os ambientes corretos

## Permissões da API Key do Google Maps

A `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` precisa das seguintes APIs habilitadas:

1. **Maps JavaScript API** - Para exibir mapas
2. **Geocoding API** - Para geocodificação de endereços
3. **Routes API** (opcional) - Para otimização de rotas

### Como Habilitar

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto
3. Vá em **APIs & Services** → **Library**
4. Busque e habilite as APIs acima
5. Configure restrições (HTTP referrers) se necessário:
   - `https://golffox.vercel.app/*`
   - `https://*.vercel.app/*` (para previews)

## Troubleshooting

### Variáveis não aparecem no código

**Problema:** Variáveis não estão disponíveis no código

**Solução:**
1. Verifique se o nome da variável está correto (case-sensitive)
2. Variáveis `NEXT_PUBLIC_*` são expostas ao cliente
3. Variáveis sem `NEXT_PUBLIC_` são apenas no servidor
4. Faça um novo deploy após adicionar variáveis

### Cron jobs retornam 401

**Problema:** Cron jobs retornam erro de autenticação

**Solução:**
1. Verifique se `CRON_SECRET` está configurado
2. Verifique se o valor está correto em ambos os ambientes
3. Verifique se o header `Authorization: Bearer ${CRON_SECRET}` está sendo enviado

### Erro de conexão com Supabase

**Problema:** Aplicação não consegue conectar ao Supabase

**Solução:**
1. Verifique se `NEXT_PUBLIC_SUPABASE_URL` está correto
2. Verifique se `NEXT_PUBLIC_SUPABASE_ANON_KEY` está correto
3. Verifique se as credenciais não expiraram
4. Teste a conexão localmente primeiro

## Comandos Úteis

```bash
# Listar todas as variáveis
vercel env ls golffox

# Remover variável
vercel env rm VARIABLE_NAME production

# Pull variáveis para .env.local
vercel env pull .env.local

# Verificar variáveis via script
node scripts/check-vercel-env.js

# Testar cron jobs
CRON_SECRET=seu_secret node scripts/test-cron-jobs.js
```

## Referências

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Maps Platform](https://developers.google.com/maps/documentation)

