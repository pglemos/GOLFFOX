# ✅ Checklist de Validação em Produção

**Data:** 07/01/2025  
**URL Produção:** https://golffox-bzj0446dr-synvolt.vercel.app

---

## 🔐 Autenticação e Autorização

### Login/Logout
- [ ] Acessar `/login` e fazer login com credenciais válidas
- [ ] Verificar redirecionamento após login bem-sucedido
- [ ] Testar logout e verificar limpeza de sessão
- [ ] Tentar login com credenciais inválidas → deve mostrar erro

### Middleware de Proteção
- [ ] Acessar `/operador` sem login → deve redirecionar para `/login`
- [ ] Acessar `/admin` sem login → deve redirecionar para `/login`
- [ ] Fazer login como `operador` e acessar `/operador` → deve funcionar
- [ ] Fazer login como `operador` e tentar acessar `/admin` → deve redirecionar para `/unauthorized`
- [ ] Fazer login como `admin` e acessar `/admin` → deve funcionar
- [ ] Fazer login como `admin` e acessar `/operador` → deve funcionar

### Cookies de Sessão
- [ ] Verificar se cookie `golffox-session` é criado após login
- [ ] Verificar se cookie é limpo após logout
- [ ] Testar expiração do cookie (1 hora)

---

## 🛡️ APIs Protegidas

### APIs de Custos
- [ ] `GET /api/costs/manual?company_id=xxx` sem auth → deve retornar 401
- [ ] `GET /api/costs/manual?company_id=xxx` com auth → deve retornar 200
- [ ] `POST /api/costs/manual` sem auth → deve retornar 401
- [ ] `POST /api/costs/manual` com auth de outra empresa → deve retornar 403
- [ ] `POST /api/costs/manual` com auth da empresa correta → deve funcionar

### APIs de Importação
- [ ] `POST /api/costs/import` sem auth → deve retornar 401
- [ ] `POST /api/costs/import` com auth → deve funcionar

### APIs de Conciliação
- [ ] `POST /api/costs/reconcile` sem auth → deve retornar 401
- [ ] `POST /api/costs/reconcile` com auth → deve funcionar

### APIs de Operador
- [ ] `POST /api/operador/create-employee` sem auth → deve retornar 401
- [ ] `POST /api/operador/create-employee` como operador → deve funcionar
- [ ] `POST /api/operador/create-employee` como admin → deve funcionar

### APIs de Admin
- [ ] `POST /api/admin/create-operador` sem auth → deve retornar 401
- [ ] `POST /api/admin/create-operador` como operador → deve retornar 403
- [ ] `POST /api/admin/create-operador` como admin → deve funcionar

---

## 🎨 Branding e UI

### Painel do Operador
- [ ] Fazer login como operador
- [ ] Verificar se logo da empresa aparece no topo (se configurado)
- [ ] Verificar se nome da empresa aparece no lugar de "GOLF FOX"
- [ ] Verificar se CompanySelector funciona corretamente
- [ ] Verificar se filtros por empresa funcionam

### Painel do Admin
- [ ] Verificar se "GOLF FOX" aparece corretamente
- [ ] Verificar se todas as funcionalidades estão acessíveis

---

## 🗺️ Mapa

### Funcionalidades Básicas
- [ ] Mapa carrega corretamente
- [ ] Marcadores aparecem nas posições corretas
- [ ] Tooltips aparecem ao passar o mouse
- [ ] Títulos descritivos nos marcadores (acessibilidade)

### FitBounds
- [ ] Ao selecionar uma rota, mapa ajusta com padding de 20%
- [ ] Conteúdo não é cortado nas bordas
- [ ] Zoom funciona corretamente

### Performance
- [ ] Mapa renderiza sem lag
- [ ] Clustering funciona (se implementado)
- [ ] Atualizações em tempo real funcionam

---

## 💰 Custos e Relatórios

### Criação de Custos
- [ ] Criar custo manual via interface
- [ ] Verificar se custo aparece na lista
- [ ] Verificar se custo está vinculado à empresa correta

### Importação de Custos
- [ ] Importar CSV de custos
- [ ] Verificar se custos são criados corretamente
- [ ] Verificar tratamento de erros

### Conciliação
- [ ] Abrir modal de conciliação
- [ ] Vincular custos a faturas
- [ ] Verificar se conciliação funciona

### Relatórios
- [ ] Gerar relatório de custos
- [ ] Exportar em CSV/Excel/PDF
- [ ] Verificar se dados estão corretos

---

## 🔒 Segurança (RLS)

### Validação de RLS
- [ ] Operador só vê dados da sua empresa
- [ ] Operador não pode acessar dados de outras empresas
- [ ] Admin vê dados de todas as empresas
- [ ] Usuário não pode se auto-adicionar a empresas (RLS v49)

### Teste de Vazamento de Dados
- [ ] Fazer login como operador da Empresa A
- [ ] Tentar acessar dados da Empresa B via API → deve retornar 403 ou 0 resultados
- [ ] Verificar logs do Supabase para queries suspeitas

---

## 📊 Performance

### Tempos de Carregamento
- [ ] Página inicial carrega em < 3s
- [ ] Página de login carrega em < 2s
- [ ] Painel do operador carrega em < 3s
- [ ] Mapa carrega em < 5s

### APIs
- [ ] APIs respondem em < 1s
- [ ] Queries complexas não travam o sistema
- [ ] Cache funciona corretamente

---

## 🐛 Logs e Monitoramento

### Vercel Dashboard
- [ ] Verificar último deployment
- [ ] Verificar Functions Logs
- [ ] Verificar Build Logs
- [ ] Verificar Analytics (se disponível)

### Supabase Dashboard
- [ ] Verificar logs de queries
- [ ] Verificar erros de RLS
- [ ] Verificar uso de recursos

### Console do Navegador
- [ ] Verificar erros JavaScript
- [ ] Verificar warnings
- [ ] Verificar requisições de rede

---

## 🔧 Funcionalidades Específicas

### Operador
- [ ] Cadastrar funcionário
- [ ] Visualizar rotas
- [ ] Sincronizar pontos de parada
- [ ] Ver KPIs da empresa

### Admin
- [ ] Criar operador
- [ ] Gerenciar empresas
- [ ] Visualizar todos os dados
- [ ] Gerenciar permissões

---

## ✅ Critérios de Sucesso

### Funcionalidades Críticas
- ✅ Login funciona
- ✅ Middleware protege rotas
- ✅ APIs retornam 401 sem auth
- ✅ APIs funcionam com auth
- ✅ Branding operador correto
- ✅ Mapa funciona
- ✅ Custos podem ser criados

### Segurança
- ✅ RLS está ativo
- ✅ Usuários não podem escalar privilégios
- ✅ Dados multi-tenant isolados

### Performance
- ✅ Páginas carregam rapidamente
- ✅ APIs respondem rapidamente
- ✅ Sem erros críticos

---

## 📝 Notas de Teste

**Data do Teste:** _______________  
**Testado por:** _______________  
**Ambiente:** Produção  
**URL:** https://golffox-bzj0446dr-synvolt.vercel.app

**Problemas Encontrados:**
- 

**Observações:**
- 

---

**Última atualização:** 07/01/2025

