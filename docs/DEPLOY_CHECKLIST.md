# Checklist de Deploy - GOLF FOX

## ✅ Pré-Deploy (Local)

- [x] Build passa localmente (`npm run build`)
- [x] Todos os arquivos commitados
- [x] Middleware configurado
- [x] Componentes adaptativos criados
- [x] Documentação criada

## 📋 Passos para Deploy na Vercel

### 1. Configurar Variáveis de Ambiente

Acesse: https://vercel.com/synvolt/golffox/settings/environment-variables

Adicione as seguintes variáveis (marcar para Production, Preview e Development conforme necessário):

#### Obrigatórias (Production + Preview):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

#### Apenas Production + Preview (NUNCA Development):
```bash
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A
```

**⚠️ IMPORTANTE**: 
- `SUPABASE_SERVICE_ROLE` é uma chave privada - nunca exponha no cliente
- Marque apenas para Production e Preview
- NÃO marque para Development

### 2. Verificar Configurações do Projeto

Acesse: https://vercel.com/synvolt/golffox/settings/general

Verifique:
- **Root Directory**: `.` (raiz) ou deixe vazio se projeto está na raiz
- **Framework Preset**: Next.js (deve ser detectado automaticamente)
- **Build Command**: `npm run build` (ou deixe padrão)
- **Output Directory**: `.next` (padrão do Next.js)
- **Install Command**: `npm install` (ou deixe padrão)

### 3. Fazer Deploy

#### Opção A: Via Git (Recomendado)

```bash
# No diretório do projeto
cd web-app
git add .
git commit -m "Deploy: Configuração de 3 painéis na Vercel"
git push origin main
```

A Vercel detectará automaticamente e iniciará o build.

#### Opção B: Via CLI

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Login
vercel login

# Deploy
cd web-app
vercel --prod
```

### 4. Verificar Build

Após o deploy iniciar:

1. Acesse: https://vercel.com/synvolt/golffox
2. Vá em **Deployments**
3. Clique no deployment mais recente
4. Verifique os **Build Logs**

**Verificar:**
- ✅ Build completou sem erros
- ✅ Variáveis de ambiente foram carregadas
- ✅ Não há erros de compilação TypeScript
- ✅ Warnings são aceitáveis (console.log, etc)

### 5. Testar URLs

Após deploy bem-sucedido, teste:

- **Admin**: https://golffox.vercel.app/admin
- **Operator**: https://golffox.vercel.app/operator  
- **Carrier**: https://golffox.vercel.app/carrier
- **Login**: https://golffox.vercel.app/login

### 6. Testar Autenticação

**Contas de teste:**
- Admin: `golffox@admin.com` / `senha123`
- Operator: `operador@empresa.com` / `senha123`
- Carrier: `transportadora@trans.com` / `senha123`

**Testes:**
- [ ] Login funciona
- [ ] Redirecionamento por role funciona
- [ ] Middleware bloqueia acesso não autorizado
- [ ] Menu lateral correto por painel
- [ ] Branding correto no topbar
- [ ] Dados vêm do Supabase (não mock)

### 7. Verificar Funcionalidades

**Admin:**
- [ ] Dashboard carrega KPIs
- [ ] Mapa carrega veículos
- [ ] Rotas funcionam
- [ ] CRUD Veículos funciona
- [ ] CRUD Motoristas funciona
- [ ] Relatórios exportam (CSV/Excel/PDF)

**Operator:**
- [ ] Dashboard mostra viagens
- [ ] Funcionários listam
- [ ] Alertas aparecem
- [ ] Ajuda funciona

**Carrier:**
- [ ] Dashboard mostra frota
- [ ] Mapa mostra veículos
- [ ] Veículos listam
- [ ] Motoristas listam
- [ ] Relatórios exportam

### 8. Verificar Mapa (Google Maps)

- [ ] Mapa carrega sem erros
- [ ] Veículos aparecem no mapa
- [ ] Marcadores SVG funcionam
- [ ] Zoom automático funciona
- [ ] Navegação rotas→mapa funciona

**Se o mapa não carregar:**
1. Verifique `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` na Vercel
2. Verifique console do navegador para erros
3. Verifique se API do Google Maps está habilitada
4. Verifique quota da API

## 🔍 Troubleshooting Rápido

### Build Falha
- Verifique logs na Vercel
- Compare com build local (`npm run build`)
- Verifique se todas as dependências estão no `package.json`

### Variáveis Não Funcionam
- Verifique se estão marcadas para o ambiente correto
- Reinicie o deployment após adicionar novas variáveis
- Verifique se nomes estão corretos (case-sensitive)

### Middleware Não Funciona
- Verifique se `middleware.ts` está na raiz de `/web-app`
- Verifique logs no console do navegador
- Teste autenticação diretamente no Supabase

### Mapa Não Carrega
- Verifique `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Verifique se API está habilitada no Google Cloud
- Verifique restrições de referrer na API Key

## 📚 Documentação Adicional

- **Deploy completo**: `docs/DEPLOY_VERCEL.md`
- **Funcionalidades**: `docs/PAINEIS.md`
- **Problemas comuns**: `docs/TROUBLESHOOTING.md`

## ✅ Após Deploy Bem-Sucedido

1. Adicione domínios personalizados (opcional)
2. Configure monitoramento (opcional)
3. Configure webhooks (opcional)
4. Teste em produção
5. Documente URLs de produção

---

**Pronto para deploy!** 🚀

