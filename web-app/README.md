# GOLF FOX - Ecossistema Completo

Sistema completo de gestão de transporte de funcionários com Painel Admin Web, Portal do Operador e Apps Flutter (Motorista + Passageiro).

## 🚀 Stack

### Web App
- **Next.js 15** (App Router)
- **React 18**
- **Tailwind CSS**
- **Framer Motion**
- **Google Maps API**
- **Supabase JS** (browser)
- **Deploy: Vercel**

### Mobile
- **Flutter**
- **supabase_flutter**
- **google_maps_flutter**
- **geolocator**

### Backend
- **Supabase** (Postgres + RLS)
- **RPCs SQL** para operações complexas
- **Views** para consultas otimizadas

## 📋 Módulos Implementados

### Painel Admin (`/admin`)
1. **Dashboard** - KPIs em tempo real + filtros
2. **Mapa da Frota** - Visualização ao vivo com Google Maps
3. **Rotas** - CRUD completo + geração automática de pontos
4. **Veículos** - CRUD + manutenção preventiva
5. **Motoristas** - CRUD + documentos + gamificação
6. **Empresas** - CRUD + funcionários cadastrados
7. **Permissões** - Gestão de papéis (admin, operator, carrier, driver, passenger)
8. **Socorro** - Ocorrências + despacho de emergência
9. **Alertas** - Histórico com filtros
10. **Relatórios** - Visões de operação (PDF/Excel)
11. **Custos** - Cálculo por rota/empresa/veículo
12. **Ajuda & Suporte** - FAQ + WhatsApp

### Portal do Operador (`/operator`)
1. **Funcionários** - Cadastro com geocodificação automática
2. **Rotas** - Visualização de funcionários por rota
3. **Sincronizar** - Reprocessamento de pontos de parada

### Apps Flutter
1. **App Motorista** - Login, checklist, rastreamento GPS, validação QR/NFC
2. **App Passageiro** - Login, visualização do ônibus em tempo real, notificações

## 🗄️ Banco de Dados

### Views
- `v_driver_last_position` - Última posição de cada motorista
- `v_active_trips` - Viagens ativas consolidadas
- `v_route_stops` - Pontos de parada por rota

### RPCs
- `gf_map_snapshot_full(p_company_id, p_route_id)` - Retorna dados completos do mapa

### Tabelas Auxiliares (Prefixo `gf_`)
- `gf_route_plan` - Plano de rota otimizado
- `gf_vehicle_costs` - Custos operacionais
- `gf_driver_events` - Gamificação
- `gf_driver_documents` - Documentos motoristas
- `gf_vehicle_maintenance` - Manutenção preventiva
- `gf_employee_company` - Funcionários (automação de passageiros)
- `gf_assistance_requests` - Solicitações de socorro
- `gf_alerts` - Alertas do sistema
- `gf_roles` / `gf_user_roles` - Sistema de permissões expandido

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` no diretório `web-app/`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vmoxzesvjcfmrebagcwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
```

### Migrations do Banco de Dados

Execute os arquivos SQL em `database/migrations/` na seguinte ordem:

1. `gf_views.sql` - Cria views necessárias
2. `gf_tables_auxiliares.sql` - Cria tabelas auxiliares
3. `gf_rpc_map_snapshot.sql` - Cria RPC do mapa

## 🚀 Deploy

### Vercel (Web App)

1. Conecte o repositório à Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Deploy automático em cada push

### Apps Flutter

```bash
# Build Android
flutter build apk --release

# Build iOS
flutter build ios --release
```

## 📱 Funcionalidades Principais

### Mapa da Frota
- Veículos coloridos por status:
  - **VERDE**: Em movimento
  - **AMARELO**: Parado até 2 min
  - **VERMELHO**: Parado a partir de 3 min
  - **AZUL**: Garagem/Terminado
- Filtros: Empresa, Rota, Motorista, Veículo, Status, Turno
- Painel lateral com informações do veículo selecionado
- Ações: Recentrar, Hoje, Histórico, Camadas

### Automação de Passageiros
- Operador cadastra funcionários (nome, CPF, endereço, empresa)
- Sistema geocodifica endereços automaticamente
- Gera pontos de parada automaticamente via Google Directions API
- Ordena pontos de forma otimizada
- Passageiro usa CPF como login

### Apps Flutter
- **Motorista**: Envia posição a cada 5s, valida embarques via QR/NFC
- **Passageiro**: Visualiza ônibus em tempo real, recebe notificações de chegada

## 🔒 Segurança

- RLS (Row Level Security) ativo no Supabase
- Políticas por papel (admin, operator, carrier, driver, passenger)
- Autenticação via Supabase Auth
- Validação de dados no frontend e backend

## 📊 Próximos Passos

1. Executar migrations SQL no Supabase
2. Configurar variáveis de ambiente na Vercel
3. Testar integração Google Maps
4. Testar Realtime Supabase
5. Ajustar autenticação nos apps Flutter se necessário

---

**Desenvolvido para GOLF FOX - Transport Management System**
