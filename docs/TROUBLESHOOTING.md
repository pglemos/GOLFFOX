# Troubleshooting - GOLF FOX

## Problemas Comuns e Soluções

### 1. Mapa Não Carrega

**Sintomas**:
- Mapa aparece em branco
- Erro no console: "Google Maps API error"
- Mensagem "Erro ao carregar mapa"

**Causas**:
- Falta `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` nas variáveis de ambiente
- API Key inválida ou expirada
- Limite de quota da API do Google Maps excedido
- Restrições de referrer na API Key

**Soluções**:

1. **Verificar Variáveis de Ambiente na Vercel**:
   - Acesse: https://vercel.com/synvolt/golffox/settings/environment-variables
   - Confirme que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` está configurada
   - Verifique se está aplicada ao ambiente correto (Production/Preview)

2. **Verificar API Key**:
   - Acesse: https://console.cloud.google.com/apis/credentials
   - Confirme que a API Key está ativa
   - Verifique se as APIs necessárias estão habilitadas:
     - Maps JavaScript API
     - Maps Embed API
     - Directions API
     - Geocoding API

3. **Verificar Restrições**:
   - Em "Application restrictions", permita:
     - HTTP referrers: `golffox.vercel.app/*`
     - Ou remova restrições temporariamente para teste

4. **Verificar Quota**:
   - Confirme que não excedeu o limite diário/mensal
   - Verifique billing na conta do Google Cloud

### 2. Não Loga no Admin / Acesso Negado

**Sintomas**:
- Redirecionado para `/unauthorized`
- Mensagem "Acesso Restrito"
- Login funciona mas não consegue acessar painéis

**Causas**:
- Role do usuário não está definida no Supabase
- Middleware não está funcionando corretamente
- Sessão do Supabase não está sendo detectada
- Role incorreta na tabela `users`

**Soluções**:

1. **Verificar Role no Supabase**:
   ```sql
   SELECT id, email, role FROM users WHERE email = 'seu@email.com';
   ```
   - Confirme que `role = 'admin'` para acessar `/admin`
   - Confirme que `role = 'operador'` para acessar `/operador`
   - Confirme que `role = 'transportadora'` para acessar `/transportadora`

2. **Atualizar Role Manualmente**:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'golffox@admin.com';
   ```

3. **Verificar Middleware**:
   - Confirme que `web-app/middleware.ts` existe
   - Verifique logs no console do navegador
   - Teste autenticação no Supabase diretamente

4. **Verificar Cookies/Sessão**:
   - Abra DevTools → Application → Cookies
   - Procure por cookies começando com `sb-`
   - Se não existirem, o login não foi bem-sucedido

5. **Revalidar Sessão**:
   - Faça logout completo
   - Limpe cookies e localStorage
   - Faça login novamente

### 3. Diferença Local x Vercel

**Sintomas**:
- Funciona localmente mas não na Vercel
- Dados mock aparecem na Vercel
- Erros 500 ou variáveis não encontradas

**Causas**:
- Variáveis de ambiente não configuradas na Vercel
- Build falhando silenciosamente
- Cache de build antigo
- Diferença entre `.env.local` (local) e Vercel env vars

**Soluções**:

1. **Verificar Todas as Variáveis**:
   - Compare `.env.local` com Vercel Environment Variables
   - Certifique-se de que TODAS as variáveis necessárias estão na Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE` (Production/Preview)
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

2. **Verificar Logs de Build**:
   - Acesse: https://vercel.com/synvolt/golffox
   - Vá em "Deployments" → Último deployment → "Build Logs"
   - Procure por erros ou warnings

3. **Forçar Novo Build**:
   - Na Vercel: "Redeploy" → "Use existing Build Cache" = OFF
   - Ou faça um commit vazio para forçar novo deploy

4. **Verificar Ambiente**:
   - Variáveis marcadas como "Production" só funcionam em produção
   - Variáveis marcadas como "Preview" funcionam em preview e produção
   - Confirme que está testando no ambiente correto

### 4. Erro 500 no Build

**Sintomas**:
- Build falha na Vercel
- Erro "Internal Server Error"
- Build passa localmente mas falha na Vercel

**Causas**:
- Import de arquivo que não existe
- Dependência faltando
- Erro de sintaxe TypeScript
- Limite de memória/timeout

**Soluções**:

1. **Reproduzir Localmente**:
   ```bash
   cd web-app
   npm install
   npm run build
   ```
   - Se falhar localmente, o problema é no código
   - Corrija antes de fazer deploy

2. **Verificar Imports**:
   - Procure por imports quebrados
   - Verifique caminhos de arquivos (case-sensitive)
   - Confirme que todos os arquivos referenciados existem

3. **Verificar Dependências**:
   - Confirme que `package.json` tem todas as dependências
   - Execute `npm install` localmente e verifique erros
   - Verifique se não há conflitos de versão

4. **Verificar TypeScript**:
   ```bash
   npm run type-check
   ```
   - Corrija todos os erros de tipo

5. **Verificar Logs Detalhados**:
   - Na Vercel, expanda os logs de build
   - Procure pela linha exata do erro
   - Erros geralmente aparecem no final dos logs

### 5. Middleware Não Funciona

**Sintomas**:
- Qualquer um pode acessar qualquer painel
- Redirecionamentos não acontecem
- Sessão não é validada

**Causas**:
- `middleware.ts` não está na raiz de `/web-app`
- Erro no código do middleware
- Cookies do Supabase não estão sendo lidos
- Variáveis de ambiente não disponíveis no middleware

**Soluções**:

1. **Verificar Localização**:
   - Confirme que `web-app/middleware.ts` existe
   - Middleware deve estar na raiz do diretório do Next.js

2. **Verificar Código**:
   - Abra `web-app/middleware.ts`
   - Verifique se não há erros de sintaxe
   - Confirme que está usando `createClient` do `@supabase/supabase-js`

3. **Verificar Logs**:
   - Adicione `console.log` no middleware (temporário)
   - Verifique logs no terminal/console da Vercel
   - Middleware roda no Edge Runtime

4. **Testar Sessão**:
   - No navegador: DevTools → Application → Cookies
   - Deve haver cookies `sb-[project]-auth-token`
   - Se não existirem, o login não funcionou

### 6. Dados Mock Aparecem ao Invés de Dados Reais

**Sintomas**:
- Dados de exemplo aparecem
- Listas vazias mesmo com dados no Supabase
- Erros silenciosos no console

**Causas**:
- Fallback para mock data quando Supabase falha
- RLS bloqueando acesso aos dados
- Query Supabase retornando vazio
- Erro na query SQL

**Soluções**:

1. **Verificar RLS Policies**:
   ```sql
   -- Verificar policies na tabela
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
   - Confirme que usuário tem permissão para ler dados
   - Teste query diretamente no Supabase SQL Editor

2. **Verificar Console do Navegador**:
   - DevTools → Console
   - Procure por erros do Supabase
   - Erros geralmente aparecem como objetos JSON

3. **Verificar Network Tab**:
   - DevTools → Network
   - Filtre por "supabase"
   - Verifique status das requisições (200 = OK, 400/500 = erro)

4. **Testar Query Diretamente**:
   - No Supabase Dashboard: SQL Editor
   - Execute a query manualmente
   - Compare resultados com o que aparece no app

### 7. Sidebar Não Mostra Menu Correto

**Sintomas**:
- Menu do admin aparece no painel do operator
- Menu incorreto para o painel atual
- Links quebrados

**Causas**:
- Prop `panel` não está sendo passada corretamente
- Detecção automática via pathname falhando
- Componente Sidebar não está recebendo prop

**Soluções**:

1. **Verificar AppShell**:
   - Abra `web-app/components/app-shell.tsx`
   - Confirme que `panel={detectedPanel}` está sendo passado para Sidebar
   - Verifique se `detectedPanel` está correto

2. **Verificar Pathname**:
   - Adicione `console.log(pathname)` temporariamente
   - Confirme que pathname começa com `/admin`, `/operador` ou `/transportadora`

3. **Passar Prop Manualmente**:
   - Nas páginas, passe explicitamente:
   ```tsx
   <AppShell panel="operador" ...>
   ```

### 8. Build Demora Muito ou Timeout

**Sintomas**:
- Build demora mais de 10 minutos
- Timeout na Vercel
- "Build exceeded maximum duration"

**Causas**:
- Dependências muito grandes
- Processamento pesado no build
- Bundle muito grande

**Soluções**:

1. **Otimizar Dependências**:
   - Remova dependências não utilizadas
   - Use `npm prune` para limpar
   - Considere usar imports dinâmicos

2. **Verificar Bundle Size**:
   ```bash
   npm run analyze
   ```
   - Identifique bibliotecas grandes
   - Use code splitting

3. **Aumentar Timeout (Vercel Pro)**:
   - Settings → Functions
   - Aumente `maxDuration` (máximo 60s no Hobby, 300s no Pro)

## Contato e Suporte

Para problemas não cobertos aqui:

1. Verifique logs na Vercel Dashboard
2. Verifique console do navegador (F12)
3. Verifique Network tab para requisições falhando
4. Consulte documentação:
   - [Next.js](https://nextjs.org/docs)
   - [Supabase](https://supabase.com/docs)
   - [Vercel](https://vercel.com/docs)

## Comandos Úteis

```bash
# Build local
cd web-app
npm run build

# Verificar tipos
npm run type-check

# Lint
npm run lint

# Testar localmente
npm run dev
```

