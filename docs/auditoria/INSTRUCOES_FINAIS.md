# Instruções Finais - Aplicação das Migrations

**Status:** ✅ Pronto para Aplicação

---

## 🚀 PASSO A PASSO COMPLETO

### Passo 1: Preparação

- [ ] Backup do banco de dados criado
- [ ] Ambiente identificado (dev/test/prod)
- [ ] Acesso ao Supabase Dashboard confirmado

---

### Passo 2: Aplicar Migrations

1. **Abrir Supabase Dashboard**
   - Ir para: https://app.supabase.com
   - Selecionar seu projeto
   - Menu lateral → **SQL Editor**

2. **Abrir Script Consolidado**
   - Arquivo: `apps/web/database/migrations/000_APPLY_ALL_MIGRATIONS.sql`
   - Copiar **TODO** o conteúdo (Ctrl+A, Ctrl+C)

3. **Aplicar no SQL Editor**
   - Clicar em **"New query"** no SQL Editor
   - Colar o conteúdo (Ctrl+V)
   - Clicar em **"Run"** ou pressionar **Ctrl+Enter**

4. **Aguardar Execução**
   - Pode levar 2-5 minutos
   - Verificar mensagens de sucesso no final

---

### Passo 3: Validar Aplicação

1. **Executar Script de Validação**
   - Arquivo: `apps/web/database/scripts/validate_migrations.sql`
   - Copiar conteúdo
   - Colar no SQL Editor
   - Executar
   - Verificar que todas as validações passam (✅)

2. **Verificação Manual (Opcional)**
   ```sql
   -- Verificar helper functions (deve retornar 5)
   SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name IN ('is_admin', 'current_role', 'current_company_id', 'current_carrier_id', 'get_user_by_id_for_login');
   
   -- Verificar RLS policies (deve retornar 30+)
   SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
   
   -- Verificar tabelas criadas (deve retornar 2)
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('trip_summary', 'gf_user_company_map');
   ```

---

### Passo 4: Habilitar Realtime

1. **Ir para Replication**
   - Dashboard → **Database** → **Replication**

2. **Habilitar driver_positions**
   - Encontrar tabela `driver_positions`
   - Clicar no toggle para **Enable**
   - ✅ Realtime agora está ativo

---

### Passo 5: Testar Funcionalidades

#### Teste 1: Autenticação
- [ ] Login funciona com CSRF token
- [ ] Cookie `golffox-session` é httpOnly (não acessível via JavaScript)
- [ ] Logout limpa cookie corretamente

#### Teste 2: RLS Policies
- [ ] Admin vê todos os dados
- [ ] Operator vê apenas dados da empresa
- [ ] Driver vê apenas próprias trips

#### Teste 3: RPC Trip Transition
- [ ] Driver pode iniciar trip (scheduled → inProgress)
- [ ] Driver pode completar trip (inProgress → completed)
- [ ] Transições inválidas são rejeitadas

#### Teste 4: Trip Summary
- [ ] Inserir posições GPS para uma trip
- [ ] Verificar se summary é calculado automaticamente
- [ ] Verificar métricas (distância, velocidade)

---

## ⚠️ TROUBLESHOOTING

### Erro: "function does not exist"

**Causa:** Ordem de aplicação incorreta  
**Solução:** Usar script consolidado (`000_APPLY_ALL_MIGRATIONS.sql`)

---

### Erro: "relation does not exist"

**Causa:** Tabela referenciada não existe  
**Solução:** Verificar se migrations anteriores foram aplicadas

---

### Erro: "permission denied"

**Causa:** RLS bloqueando operação  
**Solução:** Verificar se políticas RLS foram aplicadas corretamente

---

### Erro: "duplicate key value"

**Causa:** Migration já foi aplicada parcialmente  
**Solução:** Todas as migrations são idempotentes - pode executar novamente

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `docs/auditoria/GUIA_APLICACAO_MIGRATIONS.md` - Guia detalhado
- `docs/auditoria/CHECKLIST_APLICACAO.md` - Checklist completo
- `docs/auditoria/MIGRATIONS_CRIADAS.md` - Detalhes das migrations

---

## ✅ CONCLUSÃO

Após seguir estes passos, o sistema estará com todas as correções aplicadas e pronto para uso.

**Status:** ✅ Pronto para Aplicação

