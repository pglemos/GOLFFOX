# 🚀 Guia de Deploy no Vercel - GOLFFOX

## 📋 Pré-requisitos
- [ ] Conta no Vercel (https://vercel.com)
- [ ] Repositório GitHub configurado
- [ ] Dados do Supabase e Google Maps (já incluídos)

## 🔧 Configuração no Vercel

### 1. Importar Projeto
1. Acesse: https://vercel.com/dashboard
2. Clique em **"New Project"**
3. Conecte sua conta GitHub
4. Selecione o repositório **`pglemos/GOLFFOX`**

### 2. Configurações do Projeto
```
Framework Preset: Next.js
Root Directory: web-app
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 3. Variáveis de Ambiente
Copie as variáveis do arquivo `VERCEL_ENV_VARS.txt` e adicione no Vercel:

**Settings > Environment Variables**

#### Variáveis Obrigatórias:
```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

NODE_ENV=production
NEXTAUTH_SECRET=change-me-in-production
JWT_SECRET=change-me-in-production
```

### 4. Deploy
1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Acesse a URL gerada pelo Vercel

## 🔍 Verificação Pós-Deploy

### ✅ Checklist
- [ ] Site carrega sem erros
- [ ] Autenticação Supabase funciona
- [ ] Mapas Google carregam
- [ ] Rotas funcionam corretamente
- [ ] Responsividade OK

### 🐛 Troubleshooting

#### Erro de Build
```bash
# Verificar logs no Vercel Dashboard
# Functions > View Function Logs
```

#### Erro de Variáveis
```bash
# Verificar se todas as variáveis estão configuradas
# Settings > Environment Variables
```

#### Erro de Supabase
```bash
# Verificar URLs e chaves no Supabase Dashboard
# https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo
```

## 🌐 URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo
- **Google Cloud Console**: https://console.cloud.google.com/
- **GitHub Repository**: https://github.com/pglemos/GOLFFOX

## 📱 Domínio Personalizado (Opcional)

1. **Settings > Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. Aguarde propagação (até 48h)

## 🔄 Deploy Automático

O deploy automático está configurado via GitHub Actions:
- Push na `main` → Deploy em produção
- Push na `develop` → Deploy em preview
- Pull Request → Deploy de preview

## 📞 Suporte

- **Issues**: https://github.com/pglemos/GOLFFOX/issues
- **Discussions**: https://github.com/pglemos/GOLFFOX/discussions
- **Vercel Docs**: https://vercel.com/docs

---

**🎉 Parabéns! Seu projeto GOLFFOX está pronto para produção!**
