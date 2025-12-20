# Próximos Passos para Deploy - GOLF FOX

## ✅ Status Atual

- ✅ Build local passa com sucesso
- ✅ Middleware de autenticação criado
- ✅ 3 painéis configurados (Admin, operador, transportadora)
- ✅ Componentes adaptativos funcionando
- ✅ Todas as páginas criadas
- ✅ Documentação completa

## 🚀 Passos Imediatos para Deploy

### 1. Configurar Variáveis na Vercel (5 min)

1. Acesse: **https://vercel.com/synvolt/golffox/settings/environment-variables**

2. Clique em **"Add New"** e adicione cada variável:

#### Variáveis Públicas (Production + Preview + Development):
```
NEXT_PUBLIC_SUPABASE_URL
Valor: https://vmoxzesvjcfmrebagcwo.supabase.co
Environments: ☑ Production ☑ Preview ☑ Development

NEXT_PUBLIC_SUPABASE_ANON_KEY  
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
Environments: ☑ Production ☑ Preview ☑ Development

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Valor: AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
Environments: ☑ Production ☑ Preview ☑ Development
```

#### Variável Privada (APENAS Production + Preview):
```
SUPABASE_SERVICE_ROLE
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A
Environments: ☑ Production ☑ Preview ❌ Development
```

**⚠️ ATENÇÃO**: `SUPABASE_SERVICE_ROLE` NUNCA deve estar marcada para Development!

### 2. Verificar Configurações do Projeto (2 min)

Acesse: **https://vercel.com/synvolt/golffox/settings/general**

Verifique:
- ✅ **Root Directory**: Deixe vazio ou `.` (projeto na raiz)
- ✅ **Framework Preset**: Next.js (detectado automaticamente)
- ✅ **Build Command**: `npm run build` (ou padrão)
- ✅ **Output Directory**: `.next` (padrão)
- ✅ **Install Command**: `npm install` (ou padrão)

### 3. Fazer Deploy via Git (Recomendado)

```bash
# 1. Verificar que está no diretório correto
cd F:\GOLFFOX\web-app

# 2. Verificar status do git
git status

# 3. Adicionar todas as mudanças
git add .

# 4. Fazer commit
git commit -m "feat: Deploy - Configuração de 3 painéis (Admin/operador/transportadora) na Vercel

- Middleware de autenticação por role
- Componentes adaptativos (Sidebar, Topbar, AppShell)
- Páginas completas para operador e transportadora
- Documentação completa de deploy
- Build validado localmente"

# 5. Push para o repositório
git push origin main
```

A Vercel detectará automaticamente e iniciará o build.

### 4. Monitorar Deploy (5-10 min)

1. Acesse: **https://vercel.com/synvolt/golffox**
2. Vá em **"Deployments"**
3. Clique no deployment mais recente
4. Acompanhe os **Build Logs**

**O que verificar:**
- ✅ "Installing dependencies..." completa
- ✅ "Running build..." completa
- ✅ "Compiled successfully" aparece
- ✅ "Linting and checking validity of types" passa
- ✅ "Generating static pages" completa
- ❌ Se aparecer "Failed to compile", verifique os logs

### 5. Testar URLs Após Deploy (5 min)

Após o deploy completar com sucesso, teste:

#### URLs Principais:
- 🌐 **Admin**: https://golffox.vercel.app/admin
- 🌐 **operador**: https://golffox.vercel.app/operador
- 🌐 **transportadora**: https://golffox.vercel.app/transportadora
- 🌐 **Login**: https://golffox.vercel.app/login

#### Testes de Autenticação:

**Admin** (`golffox@admin.com` / `senha123`):
- [ ] Login funciona
- [ ] Redireciona para `/admin`
- [ ] Acessa todas as 12 abas
- [ ] Menu lateral mostra "Admin • Premium"
- [ ] Não consegue acessar `/operador` ou `/transportadora` (ou pode, se configurado)

**operador** (`operador@empresa.com` / `senha123`):
- [ ] Login funciona
- [ ] Redireciona para `/operador`
- [ ] Dashboard mostra viagens
- [ ] Menu lateral mostra 5 itens
- [ ] Não consegue acessar `/admin`

**transportadora** (`transportadora@trans.com` / `senha123`):
- [ ] Login funciona
- [ ] Redireciona para `/transportadora`
- [ ] Dashboard mostra frota
- [ ] Menu lateral mostra 7 itens
- [ ] Não consegue acessar `/admin`

### 6. Verificar Funcionalidades Críticas (10 min)

#### Admin Panel:
- [ ] Dashboard carrega KPIs do Supabase
- [ ] Mapa carrega veículos em tempo real
- [ ] CRUD Veículos funciona (criar/editar)
- [ ] CRUD Motoristas funciona
- [ ] Relatórios exportam (CSV/Excel/PDF)
- [ ] Navegação rotas→mapa funciona

#### operador Panel:
- [ ] Dashboard mostra viagens da empresa
- [ ] Funcionários listam
- [ ] Alertas aparecem

#### transportadora Panel:
- [ ] Dashboard mostra frota
- [ ] Mapa mostra veículos da transportadora
- [ ] Relatórios exportam

### 7. Verificar Mapa (Google Maps)

- [ ] Mapa carrega sem erros no console
- [ ] Veículos aparecem como marcadores
- [ ] Zoom automático funciona ao navegar de rotas
- [ ] Tooltips aparecem nos marcadores
- [ ] Barra temporal aparece na parte inferior

**Se o mapa não carregar:**
1. Abra DevTools (F12) → Console
2. Procure por erros relacionados ao Google Maps
3. Verifique se `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` está configurada
4. Verifique se a API está habilitada no Google Cloud Console

## 📋 Checklist Completo

Use o arquivo `docs/DEPLOY_CHECKLIST.md` para um checklist detalhado.

## 🔧 Se Algo Der Errado

### Build Falha
1. Verifique logs na Vercel Dashboard
2. Compare com build local: `cd web-app && npm run build`
3. Verifique se todas as dependências estão no `package.json`
4. Consulte `docs/TROUBLESHOOTING.md`

### Variáveis Não Funcionam
1. Verifique se estão marcadas para o ambiente correto
2. **Reinicie o deployment** após adicionar variáveis
3. Verifique se nomes estão corretos (case-sensitive)
4. Verifique se não há espaços extras

### Middleware Bloqueia Tudo
1. Verifique logs no console do navegador
2. Teste autenticação diretamente no Supabase
3. Verifique se `middleware.ts` está na raiz de `/web-app`
4. Verifique se role do usuário está correta na tabela `users`

### Mapa Não Carrega
1. Verifique `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` na Vercel
2. Verifique console do navegador (F12)
3. Verifique se API está habilitada: https://console.cloud.google.com/apis/library/maps-javascript-backend.googleapis.com
4. Verifique restrições de referrer na API Key

## 📚 Documentação

- **Deploy Completo**: `docs/DEPLOY_VERCEL.md`
- **Checklist**: `docs/DEPLOY_CHECKLIST.md`
- **Funcionalidades**: `docs/PAINEIS.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

## ✅ Tudo Pronto!

O sistema está **100% preparado** para deploy. Basta:

1. ✅ Configurar variáveis na Vercel
2. ✅ Fazer push do código
3. ✅ Monitorar o deploy
4. ✅ Testar as URLs

**Tempo estimado**: 15-20 minutos

**Boa sorte com o deploy!** 🚀

