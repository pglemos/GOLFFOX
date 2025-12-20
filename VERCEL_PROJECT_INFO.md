# Informações do Projeto Vercel - GOLFFOX

## 📋 Detalhes do Projeto

### Informações Principais

- **Project Name**: `golffox`
- **Project URL**: https://vercel.com/synvolt/golffox
- **Project ID**: `prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m`
- **Team URL**: https://vercel.com/synvolt
- **Team ID**: `team_9kUTSaoIkwnAVxy9nXMcAnej`

### URL de Deploy via API

- **Deploy Integration URL**: https://api.vercel.com/v1/integrations/deploy/prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m/1wJyfAoShc

Esta URL pode ser usada para acionar deploys via API.

### Configuração Local

O projeto está linkado localmente através do arquivo `.vercel/project.json`:

```json
{
  "projectId": "prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m",
  "orgId": "team_9kUTSaoIkwnAVxy9nXMcAnej",
  "projectName": "golffox"
}
```

## 🚀 Comandos Úteis

### Deploy

```bash
# Deploy para produção
vercel --prod

# Deploy de preview
vercel

# Deploy usando token
vercel --prod --token V8FJoSMM3um4TfU05Y19PwFa
```

### Informações do Projeto

```bash
# Ver informações do projeto
vercel

# Listar deployments
vercel ls

# Ver logs
vercel logs

# Abrir dashboard
vercel open
```

### Deploy via API

Você pode acionar um deploy via API usando:

```bash
curl -X POST \
  -H "Authorization: Bearer V8FJoSMM3um4TfU05Y19PwFa" \
  https://api.vercel.com/v1/integrations/deploy/prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m/1wJyfAoShc
```

## 📁 Estrutura do Projeto

- **Root Directory**: Configurado no dashboard do Vercel
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 🔐 Credenciais

- **Token Vercel**: Configurado em `AUTONOMY_RULES.md`
- **Token Extensão**: Configurado em `settings.json` do Cursor

## 📊 Status do Deploy

Para verificar o status de um deploy:

```bash
# Ver último deployment
vercel ls --prod

# Ver logs do último deploy
vercel logs
```

## 🔗 Links Úteis

- **Dashboard**: https://vercel.com/synvolt/golffox
- **Settings**: https://vercel.com/synvolt/golffox/settings
- **Deployments**: https://vercel.com/synvolt/golffox/deployments
- **Environment Variables**: https://vercel.com/synvolt/golffox/settings/environment-variables

## ✅ Status Atual

- ✅ Projeto linkado localmente
- ✅ Vercel CLI configurado
- ✅ Variáveis de ambiente baixadas
- ✅ Extensão Vercel configurada no Cursor
- ✅ MCP Vercel configurado

