# Guia de Deploy - GOLF FOX

## 📋 Checklist de Implementação

### ✅ Concluído

- [x] Variáveis de ambiente configuradas
- [x] Dependências instaladas (Google Maps, Supabase)
- [x] Views do Supabase criadas
- [x] RPC `gf_map_snapshot_full` criado
- [x] Tabelas auxiliares (prefixo `gf_`) criadas
- [x] Todas as 11 páginas do Admin criadas
- [x] Portal do Operador (3 páginas) criado
- [x] Componente Mapa da Frota com Google Maps
- [x] Apps Flutter (Motorista + Passageiro) estruturados
- [x] Correções de referências (profiles → users)

### 🔧 Próximos Passos

## 1. Configuração do Banco de Dados (Supabase)

Execute os arquivos SQL em ordem no Supabase SQL Editor:

### 1.1 Views
```sql
-- Execute: database/migrations/gf_views.sql
-- Cria: v_driver_last_position, v_active_trips, v_route_stops
```

### 1.2 Tabelas Auxiliares
```sql
-- Execute: database/migrations/gf_tables_auxiliares.sql
-- Cria: todas as tabelas com prefixo gf_
```

### 1.3 RPC do Mapa
```sql
-- Execute: database/migrations/gf_rpc_map_snapshot.sql
-- Cria: função gf_map_snapshot_full
```

## 2. Configuração do Web App (Next.js)

### 2.1 Variáveis de Ambiente

Crie o arquivo `web-app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

### 2.2 Instalar Dependências

```bash
cd web-app
npm install
```

### 2.3 Rodar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## 3. Deploy na Vercel

### 3.1 Conectar Repositório

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Clique em "Add New Project"
3. Conecte o repositório GitHub/GitLab
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.2 Variáveis de Ambiente na Vercel

Configure as seguintes variáveis de ambiente no painel da Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3.3 Deploy

Após configurar, faça o deploy:

```bash
cd web-app
vercel --prod
```

Ou via interface da Vercel: clique em "Deploy"

## 4. Apps Flutter

### 4.1 Configuração

Edite `lib/core/config/supabase_config.dart` com as credenciais:

```dart
final supabaseUrl = 'https://vmoxzesvjcfmrebagcwo.supabase.co';
final supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 4.2 Dependências

```bash
flutter pub get
```

### 4.3 Build

**Android:**
```bash
flutter build apk --release
```

**iOS:**
```bash
flutter build ios --release
```

## 5. Testes

### 5.1 Web App

1. Teste login em `/`
2. Verifique acesso ao Dashboard `/admin`
3. Teste o Mapa da Frota `/admin/mapa`
4. Teste todas as 11 páginas do Admin
5. Teste Portal do Operador `/operador`

### 5.2 Banco de Dados

```sql
-- Teste RPC do Mapa
SELECT public.gf_map_snapshot_full(NULL, NULL);

-- Verificar views
SELECT * FROM v_driver_last_position LIMIT 10;
SELECT * FROM v_active_trips LIMIT 10;
SELECT * FROM v_route_stops LIMIT 10;
```

### 5.3 Apps Flutter

1. Teste login do motorista
2. Teste checklist
3. Teste envio de posição GPS
4. Teste validação QR/NFC
5. Teste app do passageiro

## 6. Problemas Comuns

### Erro: "Supabase não configurado"
- Verifique se `.env.local` existe
- Verifique se as variáveis começam com `NEXT_PUBLIC_`

### Erro: "Google Maps não carrega"
- Verifique se a chave da API está correta
- Verifique se as bibliotecas necessárias estão habilitadas no Google Cloud Console

### Erro: "Tabela não existe"
- Execute as migrations SQL no Supabase
- Verifique se os arquivos foram executados na ordem correta

### Erro: "RLS bloqueia acesso"
- Verifique as políticas RLS no Supabase
- Certifique-se de que o usuário tem o papel correto

## 7. Estrutura de Arquivos

```
GOLFFOX/
├── web-app/                    # Next.js Web App
│   ├── app/
│   │   ├── admin/            # 11 páginas do Admin
│   │   └── operador/         # 3 páginas do Operador
│   ├── components/
│   │   ├── fleet-map.tsx    # Mapa Google Maps
│   │   └── app-shell.tsx    # Layout principal
│   └── lib/
│       ├── google-maps.ts    # Utilitários Google Maps
│       └── supabase.ts       # Cliente Supabase
├── database/
│   └── migrations/
│       ├── gf_views.sql
│       ├── gf_tables_auxiliares.sql
│       └── gf_rpc_map_snapshot.sql
└── lib/
    ├── driver_app/          # App Flutter Motorista
    └── passenger_app/        # App Flutter Passageiro
```

## 8. Suporte

- **Documentação**: `web-app/README.md`
- **Issues**: Verifique logs no Supabase Dashboard
- **Vercel Logs**: Dashboard → Project → Deployments → Logs

---

**Desenvolvido para GOLF FOX - Transport Management System**

