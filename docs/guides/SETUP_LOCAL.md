# Setup Local - GolfFox

Guia passo a passo para configurar o ambiente de desenvolvimento local.

---

## 📋 Pré-requisitos

### Software Necessário

- **Node.js 22.x** - [Download](https://nodejs.org/)
- **npm >= 9.0.0** - Vem com Node.js
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recomendado) - [Download](https://code.visualstudio.com/)

### Contas Necessárias

- **Supabase** - Para banco de dados (gratuito)
- **Google Maps API** - Para mapas (opcional para desenvolvimento)

---

## 🔧 Configuração Passo a Passo

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd GOLFFOX
```

### 2. Configure Variáveis de Ambiente

#### Criar arquivo `.env.local`

```bash
cd apps/web
cp .env.example .env.local
```

#### Configurar variáveis no `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Ambiente
NODE_ENV=development
```

**Onde obter as credenciais:**
- Supabase: Dashboard do projeto → Settings → API
- Google Maps: [Google Cloud Console](https://console.cloud.google.com/)

### 3. Instale Dependências

```bash
# Na raiz do projeto
npm install

# No app web
cd apps/web
npm install
```

### 4. Configure o Banco de Dados

#### Opção A: Usar Supabase Cloud (Recomendado)

1. Crie um projeto no [Supabase](https://supabase.com/)
2. Execute as migrations:

```bash
cd apps/web
npm run db:migrate
```

#### Opção B: Supabase Local (Avançado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase local
supabase start

# Aplicar migrations
supabase db reset
```

### 5. Inicie o Servidor

```bash
cd apps/web
npm run dev
```

Acesse: `http://localhost:3000`

---

## ✅ Verificação

### Testar se está funcionando

1. **Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Acessar aplicação:**
   - Abra `http://localhost:3000`
   - Deve ver a página de login

3. **Verificar logs:**
   - Console do terminal deve mostrar logs estruturados
   - Sem erros críticos

---

## 🐛 Problemas Comuns

### Erro: "Supabase não configurado"

**Solução:** Verifique se as variáveis de ambiente estão configuradas corretamente no `.env.local`

### Erro: "Cannot find module"

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Usar outra porta
npm run dev -- -p 3001
```

### Erro: "Migration failed"

**Solução:**
- Verifique conexão com Supabase
- Verifique se as migrations estão na ordem correta
- Consulte logs do Supabase Dashboard

---

## 📚 Próximos Passos

Após o setup:
1. Leia o [Guia de Onboarding](ONBOARDING.md)
2. Explore a [Arquitetura do Sistema](../ARCHITECTURE.md)
3. Veja o [Guia de Desenvolvimento](DEVELOPMENT.md)

---

**Última atualização:** 2025-01-XX
