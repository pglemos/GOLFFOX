# 🚀 EXECUTAR PRIMEIRO - GOLF FOX

## ⚠️ IMPORTANTE: Execute estes passos na ordem!

### ✅ PASSO 1: Configurar Variáveis de Ambiente (Web App)

```bash
cd web-app
npm run setup:env
```

Ou crie manualmente `web-app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

### ✅ PASSO 2: Executar Migrations SQL no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione o projeto
3. Vá em **SQL Editor**
4. Execute os arquivos SQL **nesta ordem**:

#### 2.1 Views Base (`database/migrations/gf_views.sql`)
```sql
-- Copie e cole TODO o conteúdo do arquivo
-- Execute no SQL Editor
```

#### 2.2 Tabelas Auxiliares (`database/migrations/gf_tables_auxiliares.sql`)
```sql
-- Copie e cole TODO o conteúdo do arquivo
-- Execute no SQL Editor
```

#### 2.3 RPC do Mapa (`database/migrations/gf_rpc_map_snapshot.sql`)
```sql
-- Copie e cole TODO o conteúdo do arquivo
-- Execute no SQL Editor
```

#### 2.4 Gamificação (v41) (`database/migrations/v41_gamification.sql`)
```sql
-- Copie e cole TODO o conteúdo do arquivo
-- Execute no SQL Editor
```

#### 2.5 KPIs e Views (v41) (`database/migrations/v41_views_kpis.sql`)
```sql
-- Copie e cole TODO o conteúdo do arquivo
-- Execute no SQL Editor
```

#### 2.6 RPCs de Rotas (v41) (`database/migrations/v41_rpc_routes.sql`)
```sql
-- Copie e cole TODO o conteúdo do arquivo
-- Execute no SQL Editor
```

### ✅ PASSO 3: Verificar Migrations

Execute no SQL Editor do Supabase:

```sql
-- Verificar views
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('v_driver_last_position', 'v_active_trips', 'v_route_stops');

-- Verificar tabelas gf_
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'gf_%'
ORDER BY table_name;

-- Verificar RPC
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'gf_map_snapshot_full';
```

**Deve retornar:**
- ✅ 6 views (v_dashboard_kpis, v_driver_last_position, v_active_trips, v_route_stops, v_driver_ranking, v_route_costs, etc)
- ✅ 12+ tabelas gf_
- ✅ 5+ RPCs (gf_map_snapshot_full, rpc_generate_route_stops, etc)

### ✅ PASSO 4: Testar Web App Localmente

```bash
cd web-app
npm install
npm run dev
```

Acesse: http://localhost:3000

**Teste:**
- ✅ Login funciona
- ✅ Dashboard carrega
- ✅ Mapa carrega Google Maps
- ✅ Todas as páginas carregam

### ✅ PASSO 5: Deploy na Vercel (Opcional)

1. Conecte repositório na Vercel
2. Configure variáveis de ambiente (mesmas do `.env.local`)
3. Deploy automático

---

## 📋 Checklist Rápido

- [ ] Variáveis de ambiente configuradas (`web-app/.env.local`)
- [ ] Migrations SQL executadas no Supabase (3 arquivos)
- [ ] Verificação SQL executada (views, tabelas, RPC)
- [ ] Web app roda localmente (`npm run dev`)
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Mapa carrega Google Maps

---

## 🔍 Arquivos de Migrations

Localização: `database/migrations/`

1. `gf_views.sql` - Views necessárias
2. `gf_tables_auxiliares.sql` - Tabelas com prefixo gf_
3. `gf_rpc_map_snapshot.sql` - RPC do mapa

---

## ⚠️ Problemas Comuns

### "Supabase não configurado"
✅ Execute: `npm run setup:env` ou crie `.env.local` manualmente

### "Tabela não existe"
✅ Execute as migrations SQL no Supabase

### "Google Maps não carrega"
✅ Verifique se a chave da API está correta

### "RPC não funciona"
✅ Execute `gf_rpc_map_snapshot.sql` no Supabase

---

**🚀 Após executar estes passos, o sistema estará pronto para uso!**

