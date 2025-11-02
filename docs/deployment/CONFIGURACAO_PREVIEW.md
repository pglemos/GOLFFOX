# 🚀 Guia de Configuração e Preview - GolfFox v7.4

## Status Atual
- ✅ Flutter 3.35.7 instalado localmente
- ✅ Dependências instaladas (`flutter pub get`)
- ✅ App iniciando em modo web
- ⏳ Aguardando configuração do Supabase

---

## 📋 Passo a Passo para Ver o App Funcionando

### 1️⃣ Executar o SQL Migration (OBRIGATÓRIO)

O banco Supabase precisa ser configurado com todas as tabelas, políticas RLS e triggers.

**Como fazer:**
1. Acesse: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/sql/new
2. Abra o arquivo `lib/supabase/migration_complete_v74.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor do Supabase
5. Clique em **RUN** (ou pressione `Ctrl+Enter`)

**O que será criado:**
- ✅ 14 tabelas com RLS
- ✅ 30+ políticas de segurança
- ✅ 4 funções helper para RLS
- ✅ Trigger automático de resumo de trips
- ✅ RPC de transição de estado

---

### 2️⃣ Criar Usuários de Teste

Você precisa criar 5 usuários para testar os diferentes perfis:

**Acesse:** https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/auth/users

Para cada usuário, clique em **"Add User"** e configure:

| Email | Senha | Confirmado |
|-------|-------|-----------|
| `admin@trans.com` | `senha123` | ✅ |
| `operador@trans.com` | `senha123` | ✅ |
| `transportadora@trans.com` | `senha123` | ✅ |
| `motorista@trans.com` | `senha123` | ✅ |
| `passageiro@trans.com` | `senha123` | ✅ |

**Importante:** Marque "Email confirmed" para todos!

---

### 3️⃣ Pegar IDs e Atualizar Seeds

Depois de criar os usuários:

1. **No SQL Editor, execute:**
```sql
SELECT id, email FROM auth.users 
WHERE email IN (
  'admin@trans.com',
  'operador@trans.com', 
  'transportadora@trans.com',
  'motorista@trans.com',
  'passageiro@trans.com'
);
```

2. **Copie os IDs retornados**

3. **Abra:** `lib/supabase/seeds_v74.sql`

4. **Substitua** os UUIDs placeholder pelos IDs reais:
   - Procure por `'00000000-0000-0000-0000-0000000000d1'` → Substitua pelo ID do motorista
   - Procure por `'00000000-0000-0000-0000-0000000000p1'` → Substitua pelo ID do passageiro

5. **Execute os seeds** no SQL Editor

---

### 4️⃣ Ativar Realtime (Para Tracking em Tempo Real)

1. Acesse: https://supabase.com/dashboard/project/vmoxzesvjcfmrebagcwo/database/replication
2. Encontre a tabela `driver_positions`
3. Ative o toggle para publicação Realtime
4. Clique em **Save**

---

### 5️⃣ Verificar Status do App

O app Flutter já está rodando em modo web. Para acessar:

1. **Abra seu navegador**
2. **Acesse:** http://localhost:XXXX (verifique o console)
3. Ou use: http://localhost:50000 (porta padrão Flutter web)

---

## 🎯 Testando as Funcionalidades

### Login

Use uma das contas criadas:
- **Email:** `motorista@trans.com`
- **Senha:** `senha123`

### Perfis Disponíveis

1. **Admin** (`admin@trans.com`)
   - Dashboard administrativo completo
   - Gestão de empresas e transportadoras
   - Visualização de todas as trips

2. **Operador** (`operador@trans.com`)
   - Gestão de rotas e horários
   - Visualização de trips da empresa

3. **Transportadora** (`transportadora@trans.com`)
   - Gestão de frota e motoristas
   - Visualização de trips da transportadora

4. **Motorista** (`motorista@trans.com`)
   - Dashboard com trips atribuídas
   - Track de posição em tempo real
   - Transições de status de trip

5. **Passageiro** (`passageiro@trans.com`)
   - Visualização de trips disponíveis
   - Tracking em tempo real da viagem
   - Histórico de viagens

---

## 🔧 Comandos Úteis

### Rodar o App
```powershell
.\tools\flutter\bin\flutter.bat run -d chrome --web-renderer html
```

### Build para Web
```powershell
.\tools\flutter\bin\flutter.bat build web
```

### Verificar Status Supabase
```powershell
.\scripts\supabase_check.ps1
```

### Testar Conexão
```powershell
.\tools\flutter\bin\flutter.bat run tools\flutter\dev\tools\bin\validate_setup.dart
```

---

## 🐛 Problemas Comuns

### Erro: "User not found"
- **Solução:** Verifique se o usuário foi criado em `auth.users` E em `public.users`

### Erro: "RLS Policy Violation"
- **Solução:** Execute a migration SQL novamente

### Realtime não funciona
- **Solução:** Verifique se `driver_positions` está publicado em Replication

### App não inicia
- **Solução:** Verifique se as dependências estão instaladas:
  ```powershell
  .\tools\flutter\bin\flutter.bat pub get
  ```

---

## 📊 Arquitetura do Sistema

```
Flutter App (Web/Mobile)
    ↓
Supabase Client
    ├─ Auth (JWT + RLS)
    ├─ Realtime (WebSocket)
    └─ PostgreSQL (Database)
```

**Componentes:**
- **Auth:** 5 perfis (admin, operador, transportadora, motorista, passageiro)
- **RLS:** Políticas granulares por papel
- **Realtime:** Tracking de posição em tempo real
- **Triggers:** Cálculo automático de distância/tempo/velocidade

---

## ✅ Checklist Final

- [ ] SQL Migration executada
- [ ] 5 usuários criados
- [ ] Seeds executados com IDs corretos
- [ ] Realtime ativado
- [ ] App rodando em web
- [ ] Login funcionando
- [ ] Dashboard específico por perfil aparecendo
- [ ] Tracking em tempo real funcionando (motorista)

---

## 📝 Notas Importantes

1. **Credenciais do Supabase já estão configuradas** no código:
   - URL: `https://vmoxzesvjcfmrebagcwo.supabase.co`
   - Anon Key: Já configurada em `lib/supabase/supabase_config.dart`

2. **Tudo é idempotente:** Pode executar migrations múltiplas vezes

3. **App usa arquitetura reativa:** Mudanças no banco são refletidas em tempo real

4. **RLS protege todos os dados:** Cada papel vê apenas o que tem permissão

---

## 🎉 Pronto!

Após executar os passos acima, você terá acesso completo a todas as funcionalidades do GolfFox v7.4!

Para mais detalhes, consulte:
- `START_HERE.md` - Guia rápido
- `IMPLEMENTATION_COMPLETE.md` - Detalhes técnicos
- `VALIDATION_CHECKLIST.md` - Queries de validação

