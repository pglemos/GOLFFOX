# 🚀 Guia de Deploy na Vercel - GolfFox Web App

## ✅ Pré-requisitos Concluídos

- [x] Variáveis de ambiente configuradas
- [x] Migrações SQL executadas no Supabase
- [x] Aplicação funcionando localmente
- [x] Arquivo `vercel.json` criado

## 📋 Passos para Deploy na Vercel

### 1. Acesse a Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub/GitLab/Bitbucket

### 2. Conecte o Repositório
1. Clique em **"New Project"**
2. Selecione o repositório do GolfFox
3. Escolha o diretório `web-app` como root directory

### 3. Configure as Variáveis de Ambiente
Na seção **Environment Variables**, adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

### 4. Configurações de Build
- **Framework Preset**: Next.js
- **Root Directory**: `web-app`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 5. Deploy
1. Clique em **"Deploy"**
2. Aguarde o build completar (2-5 minutos)
3. Acesse a URL gerada pela Vercel

## 🔧 Configurações Avançadas (Opcional)

### Custom Domain
1. Vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções

### Performance
- **Edge Functions**: Habilitado automaticamente
- **Image Optimization**: Configurado no Next.js
- **Caching**: Configurado automaticamente

## ✅ Verificação Pós-Deploy

Após o deploy, teste:

1. **Acesso**: A aplicação carrega corretamente
2. **Login**: Sistema de autenticação funciona
3. **Dashboard**: Dados do Supabase são carregados
4. **Mapa**: Google Maps carrega corretamente
5. **Navegação**: Todas as páginas funcionam

## 🚨 Troubleshooting

### Build Falha
- Verifique se todas as dependências estão no `package.json`
- Confirme que não há erros de TypeScript/ESLint

### Variáveis de Ambiente
- Certifique-se que todas as variáveis estão configuradas
- Variáveis devem começar com `NEXT_PUBLIC_` para serem acessíveis no frontend

### Supabase Connection
- Verifique se as URLs e chaves estão corretas
- Confirme que as migrações foram executadas

## 📊 Monitoramento

A Vercel fornece:
- **Analytics**: Métricas de performance
- **Logs**: Logs de build e runtime
- **Monitoring**: Uptime e erros

## 🔄 Deploy Automático

Após configuração inicial:
- Push para branch `main` → Deploy automático
- Pull requests → Preview deployments
- Rollback disponível no dashboard

---

**🎉 Sua aplicação GolfFox estará disponível globalmente via CDN da Vercel!**