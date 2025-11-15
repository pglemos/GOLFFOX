# 🚀 Instruções de Setup - GOLF FOX

## Passo a Passo Completo

### 1. Configurar Banco de Dados (Supabase)

#### 1.1 Acessar Supabase SQL Editor

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione o projeto: `vmoxzesvjcfmrebagcwo`
3. Vá em **SQL Editor** no menu lateral

#### 1.2 Executar Migrations SQL

Execute os arquivos SQL **na ordem abaixo**:

**Passo 1: Views** (`database/migrations/gf_views.sql`)
```sql
-- Copie e cole o conteúdo completo do arquivo gf_views.sql
-- Execute no SQL Editor
```

**Passo 2: Tabelas Auxiliares** (`database/migrations/gf_tables_auxiliares.sql`)
```sql
-- Copie e cole o conteúdo completo do arquivo gf_tables_auxiliares.sql
-- Execute no SQL Editor
```

**Passo 3: RPC do Mapa** (`database/migrations/gf_rpc_map_snapshot.sql`)
```sql
-- Copie e cole o conteúdo completo do arquivo gf_rpc_map_snapshot.sql
-- Execute no SQL Editor
```

#### 1.3 Verificar Instalação

Execute no SQL Editor para verificar:

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

Deve retornar:
- **3 views**: v_driver_last_position, v_active_trips, v_route_stops
- **9 tabelas gf_**: gf_route_plan, gf_vehicle_costs, gf_driver_events, gf_driver_documents, gf_vehicle_maintenance, gf_employee_company, gf_assistance_requests, gf_alerts, gf_roles, gf_user_roles
- **1 RPC**: gf_map_snapshot_full

---

### 2. Configurar Web App (Next.js)

#### 2.1 Instalar Dependências

```bash
cd web-app
npm install
```

#### 2.2 Configurar Variáveis de Ambiente

**Opção 1: Usando o script**
```bash
npm run setup:env
```

**Opção 2: Manualmente**

Crie o arquivo `web-app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

#### 2.3 Rodar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

#### 2.4 Verificar Funcionamento

1. **Login**: `/`
   - Use uma das contas demo
   - Ex: `golffox@admin.com` / `senha123`

2. **Dashboard**: `/admin`
   - Deve mostrar KPIs e cards

3. **Mapa**: `/admin/mapa`
   - Deve carregar Google Maps
   - Pode não mostrar veículos ainda (sem dados)

4. **Outras páginas**: Navegue pelo menu lateral

---

### 3. Deploy na Vercel

#### 3.1 Conectar Repositório

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Clique em **Add New Project**
3. Conecte seu repositório GitHub/GitLab

#### 3.2 Configurar Projeto

- **Framework Preset**: Next.js
- **Root Directory**: `web-app`
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (automático)

#### 3.3 Variáveis de Ambiente na Vercel

Configure no painel da Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

#### 3.4 Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Acesse a URL fornecida

#### 3.5 Verificar Deploy

- Acesse a URL do deploy
- Teste login
- Teste todas as páginas

---

### 4. Configurar Apps Flutter

#### 4.1 Instalar Dependências

```bash
# Na raiz do projeto (F:\GOLFFOX)
flutter pub get
```

#### 4.2 Configurar Supabase no Flutter

Edite `lib/core/config/supabase_config.dart` ou similar:

```dart
final supabaseUrl = 'https://vmoxzesvjcfmrebagcwo.supabase.co';
final supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

#### 4.3 Configurar Google Maps (se necessário)

1. Obtenha chave do Google Maps para Flutter
2. Configure em `android/app/src/main/AndroidManifest.xml` (Android)
3. Configure em `ios/Runner/AppDelegate.swift` (iOS)

#### 4.4 Build

**Android:**
```bash
flutter build apk --release
# ou
flutter build appbundle --release
```

**iOS:**
```bash
flutter build ios --release
```

---

### 5. Testar Sistema Completo

#### 5.1 Testar Web App

- [ ] Login funciona
- [ ] Dashboard carrega KPIs
- [ ] Mapa carrega Google Maps
- [ ] Todas as 11 páginas do Admin carregam
- [ ] Portal do Operador funciona
- [ ] Criar funcionário funciona
- [ ] Sincronizar pontos funciona

#### 5.2 Testar Banco de Dados

```sql
-- Teste RPC do Mapa
SELECT public.gf_map_snapshot_full(NULL, NULL);

-- Verificar dados
SELECT * FROM v_driver_last_position LIMIT 10;
SELECT * FROM v_active_trips LIMIT 10;
SELECT * FROM gf_employee_company LIMIT 10;
```

#### 5.3 Testar Apps Flutter

- [ ] Login do motorista funciona
- [ ] Checklist funciona
- [ ] Envio de posição GPS funciona
- [ ] Login do passageiro funciona
- [ ] Visualização do ônibus funciona

---

### 6. Troubleshooting

#### Erro: "Supabase não configurado"
- ✅ Verifique se `.env.local` existe
- ✅ Verifique se as variáveis começam com `NEXT_PUBLIC_`
- ✅ Reinicie o servidor (`npm run dev`)

#### Erro: "Google Maps não carrega"
- ✅ Verifique se a chave da API está correta
- ✅ Verifique se as bibliotecas necessárias estão habilitadas no Google Cloud Console
- ✅ Verifique se o domínio está autorizado no Google Cloud Console

#### Erro: "Tabela não existe"
- ✅ Execute as migrations SQL no Supabase
- ✅ Verifique se foram executadas na ordem correta
- ✅ Execute a verificação SQL acima

#### Erro: "RLS bloqueia acesso"
- ✅ Verifique as políticas RLS no Supabase
- ✅ Certifique-se de que o usuário tem o papel correto
- ✅ Verifique se está autenticado

#### Erro: "RPC não funciona"
- ✅ Verifique se `gf_map_snapshot_full` foi criada
- ✅ Teste diretamente no SQL Editor
- ✅ Verifique permissões (GRANT EXECUTE)

---

### 7. Checklist Final

Antes de considerar o setup completo:

- [ ] Migrations SQL executadas no Supabase
- [ ] Views criadas e verificadas
- [ ] Tabelas gf_ criadas e verificadas
- [ ] RPC gf_map_snapshot_full criada e verificada
- [ ] Variáveis de ambiente configuradas (`web-app/.env.local`)
- [ ] Web app roda localmente (`npm run dev`)
- [ ] Login funciona no web app
- [ ] Dashboard carrega
- [ ] Mapa carrega Google Maps
- [ ] Todas as páginas carregam
- [ ] Deploy na Vercel configurado
- [ ] Variáveis de ambiente na Vercel configuradas
- [ ] Deploy funcionando
- [ ] Apps Flutter configurados (se necessário)

---

**✅ Setup Completo!**

Se todos os itens acima foram concluídos, o sistema está pronto para uso!

---

**Desenvolvido para GOLF FOX - Transport Management System**

