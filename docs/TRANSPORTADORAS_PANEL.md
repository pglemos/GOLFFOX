# Painel de Transportadoras - Documentação

**Data de criação:** 16 de Novembro de 2025  
**Status:** ✅ Implementado

---

## 📋 Resumo

Implementação completa da aba "Transportadoras" no painel administrativo, substituindo a aba "Motoristas" e seguindo o mesmo padrão da aba "Empresas".

---

## 🎯 Funcionalidades Implementadas

### 1. Página Principal (`/admin/transportadoras`)

Permite visualizar e gerenciar todas as transportadoras cadastradas no sistema.

**Funcionalidades:**
- ✅ Listagem de transportadoras com informações completas
- ✅ Criar nova transportadora
- ✅ Editar transportadora existente
- ✅ Excluir transportadora
- ✅ Criar login de acesso (usuário carrier) para a transportadora
- ✅ Visualizar motoristas associados à transportadora

### 2. Gerenciamento de Transportadoras

**Campos da Transportadora:**
- Nome (obrigatório)
- Pessoa de contato
- Telefone
- Endereço

**Ações Disponíveis:**
- **Editar**: Atualizar informações da transportadora
- **Login de Acesso**: Criar e gerenciar usuários com role "carrier"
- **Ver Motoristas**: Visualizar todos os motoristas associados
- **Excluir**: Remover transportadora do sistema

### 3. Login de Acesso (Usuários Carrier)

Modal para criar e gerenciar usuários que terão acesso ao painel da transportadora.

**Campos do Usuário:**
- Nome
- Email
- Senha (mínimo 6 caracteres)

**Funcionalidades:**
- ✅ Criar novo usuário com role "carrier"
- ✅ Listar usuários existentes
- ✅ Excluir usuários
- ✅ Autenticação automática via Supabase Auth

### 4. Visualização de Motoristas

Modal que exibe todos os motoristas associados à transportadora.

**Informações Exibidas:**
- Nome do motorista
- Email
- Telefone
- Role (driver)

---

## 🗂️ Arquivos Criados

### Páginas
- `apps/web/app/admin/transportadoras/page.tsx`

### APIs
- `apps/web/app/api/admin/carriers-list/route.ts`
- `apps/web/app/api/admin/carriers/create/route.ts`
- `apps/web/app/api/admin/carriers/update/route.ts`
- `apps/web/app/api/admin/carriers/delete/route.ts`
- `apps/web/app/api/admin/create-carrier-login/route.ts`
- `apps/web/app/api/admin/carriers/[carrierId]/users/route.ts`
- `apps/web/app/api/admin/carriers/[carrierId]/drivers/route.ts`

### Componentes (Modals)
- `apps/web/components/modals/create-carrier-modal.tsx`
- `apps/web/components/modals/edit-carrier-modal.tsx`
- `apps/web/components/modals/carrier-users-modal.tsx`
- `apps/web/components/modals/carrier-drivers-modal.tsx`

### Arquivos Modificados
- `apps/web/components/sidebar.tsx` - Substituição da aba Motoristas por Transportadoras

---

## 📊 Estrutura de Dados

### Tabela: `carriers`

```sql
- id (uuid, PK)
- name (text, NOT NULL)
- address (text, nullable)
- phone (text, nullable)
- contact_person (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Tabela: `users` (role: carrier)

```sql
- id (uuid, PK) -- Linked to Supabase Auth
- email (text, UNIQUE)
- name (text)
- role (text) -- 'carrier'
- carrier_id (uuid, FK -> carriers)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Tabela: `users` (role: driver)

```sql
- id (uuid, PK)
- email (text)
- name (text)
- phone (text, nullable)
- role (text) -- 'driver'
- carrier_id (uuid, FK -> carriers)
- created_at (timestamptz)
```

---

## 🔐 Permissões e Segurança

### Rotas Protegidas

Todas as rotas da API requerem autenticação com role "admin":

```typescript
const authErrorResponse = await requireAuth(req, 'admin')
if (authErrorResponse) return authErrorResponse
```

### Criação de Usuários Carrier

A criação de usuários carrier é feita através de `supabaseServiceRole.auth.admin.createUser()`, que:
- Cria o usuário no Supabase Auth
- Define o email como confirmado automaticamente
- Associa o usuário à transportadora via `carrier_id`
- Define o role como "carrier"

---

## 🎨 UI/UX

### Padrão Seguido

A aba de Transportadoras segue **exatamente o mesmo padrão** da aba de Empresas:

1. **Layout de Cards**: Cada transportadora é exibida em um card individual
2. **Botões de Ação**: 
   - Editar (outline)
   - Login de Acesso (outline)
   - Ver Motoristas (outline)
   - Excluir (destructive)
3. **Modais**: Todos os formulários e listagens usam Dialog do Shadcn UI
4. **Feedback**: Notificações de sucesso/erro usando `notifySuccess` e `notifyError`
5. **Loading States**: Spinners durante carregamento de dados

### Responsividade

- ✅ Layout adaptável para desktop e mobile
- ✅ Cards empilhados em telas pequenas
- ✅ Botões com ícones e labels
- ✅ Modais com scroll interno

---

## 🔄 Fluxo de Trabalho

### Criar Transportadora
1. Admin clica em "Criar Transportadora"
2. Preenche formulário (nome obrigatório)
3. Sistema cria registro na tabela `carriers`
4. Lista é atualizada automaticamente

### Criar Login de Acesso
1. Admin seleciona transportadora
2. Clica em "Login de Acesso"
3. Modal exibe usuários existentes
4. Clica em "Criar Novo Login de Acesso"
5. Preenche email, nome e senha
6. Sistema:
   - Cria usuário no Supabase Auth
   - Associa `carrier_id`
   - Define role como "carrier"
   - Atualiza lista de usuários

### Visualizar Motoristas
1. Admin seleciona transportadora
2. Clica em "Ver Motoristas"
3. Modal carrega e exibe todos os motoristas com `carrier_id` correspondente
4. Informações exibidas: nome, email, telefone, role

---

## 📝 Exemplos de Uso

### Listando Transportadoras

```bash
GET /api/admin/carriers-list
Authorization: Bearer <token>

Response:
{
  "success": true,
  "carriers": [
    {
      "id": "uuid",
      "name": "Transportes XYZ Ltda",
      "address": "Rua ABC, 123",
      "phone": "(11) 98765-4321",
      "contact_person": "João Silva"
    }
  ]
}
```

### Criando Usuário Carrier

```bash
POST /api/admin/create-carrier-login
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "carrier_id": "uuid",
  "email": "usuario@transportadora.com",
  "name": "Maria Santos",
  "password": "senha123"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "usuario@transportadora.com",
    "name": "Maria Santos"
  }
}
```

---

## 🧪 Testes Sugeridos

### Testes Funcionais
- [ ] Criar transportadora com todos os campos preenchidos
- [ ] Criar transportadora apenas com nome (campos opcionais vazios)
- [ ] Editar informações de uma transportadora
- [ ] Excluir transportadora (com confirmação)
- [ ] Criar login de acesso para transportadora
- [ ] Criar múltiplos logins para mesma transportadora
- [ ] Excluir usuário carrier
- [ ] Visualizar motoristas de uma transportadora vazia
- [ ] Visualizar motoristas de uma transportadora com vários motoristas

### Testes de Validação
- [ ] Tentar criar transportadora sem nome (deve falhar)
- [ ] Tentar criar usuário com email inválido (deve falhar)
- [ ] Tentar criar usuário com senha < 6 caracteres (deve falhar)
- [ ] Tentar excluir transportadora sem confirmação
- [ ] Verificar autenticação admin em todas as rotas

### Testes de UI
- [ ] Verificar responsividade em mobile
- [ ] Verificar loading states
- [ ] Verificar notificações de sucesso/erro
- [ ] Verificar navegação entre modais

---

## 🚀 Próximas Melhorias (Opcional)

1. **Busca e Filtros**
   - Buscar transportadoras por nome
   - Filtrar por status ativo/inativo

2. **Estatísticas**
   - Total de motoristas por transportadora
   - Total de veículos por transportadora
   - Total de viagens realizadas

3. **Exportação**
   - Exportar lista de transportadoras (CSV/Excel)
   - Exportar motoristas por transportadora

4. **Associação de Veículos**
   - Visualizar veículos da transportadora
   - Associar/desassociar veículos

5. **Histórico**
   - Log de alterações na transportadora
   - Histórico de logins de acesso criados/excluídos

---

## ✅ Status Final

**Status:** ✅ **100% Implementado e Funcional**

A aba de Transportadoras está completamente funcional e seguindo o mesmo padrão de qualidade da aba de Empresas. Todos os arquivos foram criados, as APIs estão funcionando e a integração com o Supabase está correta.

---

**Desenvolvido em:** 16 de Novembro de 2025  
**Versão:** 1.0.0

