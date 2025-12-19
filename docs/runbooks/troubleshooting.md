# Runbook: Troubleshooting - GolfFox

**Última atualização:** 2025-01-XX

---

## 📋 Visão Geral

Este runbook lista problemas comuns e suas soluções.

---

## 🔐 Problemas de Autenticação

### Login Não Funciona

**Sintomas:**
- Erro 401/403 ao fazer login
- Redirecionamento para login mesmo autenticado

**Soluções:**

1. **Verificar Cookies**
   ```javascript
   // Console do navegador
   document.cookie
   // Verificar se golffox-session existe
   ```

2. **Verificar CSRF Token**
   - Acessar `/api/auth/csrf`
   - Verificar se cookie `golffox-csrf` é criado

3. **Verificar Variáveis de Ambiente**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Verificar Logs**
   - Vercel Logs → Verificar erros de autenticação
   - Supabase Logs → Verificar tentativas de login

### Sessão Expira Rapidamente

**Solução:**
- Verificar TTL do cookie `golffox-session` (padrão: 1 hora)
- Verificar refresh token do Supabase

---

## 🗄️ Problemas de Banco de Dados

### Query Lenta

**Sintomas:**
- APIs demoram muito para responder
- Timeout em algumas queries

**Soluções:**

1. **Verificar Índices**
   ```sql
   -- Verificar índices de uma tabela
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'table_name';
   ```

2. **Analisar Query**
   ```sql
   EXPLAIN ANALYZE SELECT ...;
   ```

3. **Verificar Materialized Views**
   - Atualizar se desatualizada:
     ```sql
     REFRESH MATERIALIZED VIEW mv_name;
     ```

### Erro de RLS (Row Level Security)

**Sintomas:**
- Erro "new row violates row-level security policy"
- Dados não aparecem mesmo autenticado

**Soluções:**

1. **Verificar Políticas RLS**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'table_name';
   ```

2. **Verificar Contexto do Usuário**
   - Verificar `auth.uid()` no Supabase
   - Verificar `company_id` do usuário

3. **Usar Service Role (se necessário)**
   - Apenas em operações admin
   - Nunca expor service role key no cliente

---

## 🌐 Problemas de API

### Erro 500 em Produção

**Sintomas:**
- APIs retornam 500
- Erro genérico "Internal Server Error"

**Soluções:**

1. **Verificar Logs do Vercel**
   - Dashboard → Projeto → Logs
   - Filtrar por erro 500

2. **Verificar Variáveis de Ambiente**
   - Todas configuradas?
   - Valores corretos?

3. **Verificar Rate Limiting**
   - Upstash Redis funcionando?
   - Limite excedido?

4. **Verificar Supabase**
   - Conexão funcionando?
   - Service role key válida?

### CORS Errors

**Sintomas:**
- Erro "CORS policy" no navegador
- Requisições bloqueadas

**Soluções:**

1. **Verificar Headers CORS**
   - `next.config.js` → headers()
   - Verificar `Access-Control-Allow-Origin`

2. **Verificar Origin**
   - Requisições vêm de origem permitida?

---

## 🎨 Problemas de Frontend

### Página Não Carrega

**Sintomas:**
- Página em branco
- Erro no console do navegador

**Soluções:**

1. **Verificar Console do Navegador**
   - F12 → Console
   - Verificar erros JavaScript

2. **Verificar Network Tab**
   - Requisições falhando?
   - 404 em recursos?

3. **Verificar Build**
   - Build completou sem erros?
   - Assets gerados corretamente?

### Erro de Hydration

**Sintomas:**
- Warning "Hydration failed"
- Conteúdo diferente entre servidor e cliente

**Soluções:**

1. **Verificar `suppressHydrationWarning`**
   - Adicionar onde necessário

2. **Verificar Data/Time**
   - Não usar `new Date()` diretamente
   - Usar `date-fns` ou similar

3. **Verificar Conditional Rendering**
   - Evitar renderização diferente no servidor/cliente

---

## 📊 Problemas de Performance

### Site Lento

**Sintomas:**
- Páginas demoram para carregar
- Interações lentas

**Soluções:**

1. **Verificar Web Vitals**
   - Vercel Dashboard → Speed Insights
   - Identificar métricas ruins

2. **Verificar Bundle Size**
   ```bash
   npm run build
   # Verificar tamanho dos bundles
   ```

3. **Verificar Queries**
   - Queries muito lentas?
   - Usar cache (Redis)

4. **Verificar Imagens**
   - Imagens otimizadas?
   - Usar Next.js Image component

### Memory Leaks

**Sintomas:**
- Site fica lento após uso prolongado
- Alto uso de memória

**Soluções:**

1. **Verificar Event Listeners**
   - Remover listeners ao desmontar componentes

2. **Verificar Subscriptions**
   - Supabase Realtime subscriptions
   - Fechar ao desmontar

3. **Verificar Cache**
   - Cache muito grande?
   - Limpar cache periodicamente

---

## 🔧 Problemas de Build

### Build Falha

**Sintomas:**
- Deploy falha no Vercel
- Erro de compilação

**Soluções:**

1. **Verificar Erros TypeScript**
   ```bash
   npm run type-check
   ```

2. **Verificar Dependências**
   ```bash
   npm install
   ```

3. **Verificar `next.config.js`**
   - Configurações corretas?
   - `ignoreBuildErrors` (temporário)

4. **Verificar Variáveis de Ambiente**
   - Todas definidas no Vercel?

---

## 📝 Logs e Debugging

### Onde Ver Logs

1. **Vercel Logs**
   - Dashboard → Projeto → Logs
   - Filtrar por função/rota

2. **Supabase Logs**
   - Dashboard → Logs
   - SQL queries, auth, etc.

3. **Browser Console**
   - F12 → Console
   - Erros JavaScript

4. **Network Tab**
   - F12 → Network
   - Requisições HTTP

### Debug Mode

**Desenvolvimento:**
```bash
# Logs detalhados
NODE_ENV=development npm run dev
```

**Produção:**
- Verificar logs estruturados
- Usar `logError`, `debug`, `warn` do logger

---

## 🆘 Quando Pedir Ajuda

Se nenhuma solução acima funcionar:

1. **Coletar Informações**
   - Screenshot do erro
   - Logs relevantes
   - Passos para reproduzir

2. **Verificar Documentação**
   - `docs/` - Documentação do projeto
   - ADRs - Decisões arquiteturais

3. **Criar Issue**
   - GitHub Issues
   - Incluir todas as informações coletadas

---

**Última atualização:** 2025-01-XX
