# Aplicação Rápida - Migrations Golf Fox

**Tempo estimado:** 2-5 minutos

---

## 🚀 3 PASSOS SIMPLES

### 1. Aplicar Migrations

1. Abrir Supabase Dashboard: https://app.supabase.com
2. Selecionar projeto → **SQL Editor**
3. Abrir arquivo: `apps/web/database/migrations/000_APPLY_ALL_MIGRATIONS.sql`
4. Copiar TODO o conteúdo (Ctrl+A, Ctrl+C)
5. Colar no SQL Editor (Ctrl+V)
6. Clicar em **"Run"** ou pressionar **Ctrl+Enter**
7. Aguardar execução (2-5 minutos)

### 2. Validar

1. Abrir arquivo: `apps/web/database/scripts/validate_migrations.sql`
2. Copiar conteúdo
3. Colar no SQL Editor
4. Executar
5. Verificar que todas as validações passam (✅)

### 3. Habilitar Realtime

1. Dashboard → **Database** → **Replication**
2. Encontrar tabela: `driver_positions`
3. Clicar no toggle para **Enable**
4. ✅ Pronto!

---

## ✅ VERIFICAÇÃO RÁPIDA

```sql
-- Deve retornar 5
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'current_role', 'current_company_id', 'current_carrier_id', 'get_user_by_id_for_login');

-- Deve retornar 30+
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';

-- Deve retornar 2
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('trip_summary', 'gf_user_company_map');
```

---

## ❌ PROBLEMAS?

Ver: `docs/auditoria/INSTRUCOES_FINAIS.md` → Seção Troubleshooting

---

## ✅ PRONTO!

Após esses 3 passos, todas as correções estarão aplicadas!

