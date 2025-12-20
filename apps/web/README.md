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
   - Playback histórico com controles de velocidade
   - Export PNG/CSV do mapa
   - Filtros avançados (empresa, rota, veículo, status, turno)
   - Deep-links para compartilhamento
3. **Rotas** - CRUD completo + geração automática de pontos
4. **Veículos** - CRUD + manutenção preventiva
5. **Motoristas** - CRUD + documentos + gamificação
6. **Empresas** - CRUD + funcionários cadastrados
7. **Permissões** - Gestão de papéis (admin, operador, transportadora, motorista, passageiro)
8. **Socorro** - Ocorrências + despacho de emergência
9. **Alertas** - Histórico com filtros
10. **Relatórios** - Visões de operação (PDF/Excel/CSV)
    - Agendamento automático via cron jobs
    - Envio por email (Resend/SMTP)
    - Histórico de gerações
11. **Custos** - Cálculo por rota/empresa/veículo
    - Conciliação de faturas com workflow completo
    - Export de relatórios de conciliação
12. **Ajuda & Suporte** - FAQ + WhatsApp
13. **Sincronização** - Monitor de sincronização Supabase
    - Histórico completo de operações
    - Reprocessamento de falhas
    - Status em tempo real

### Portal do Operador (`/operador`)
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
# Supabase (Obrigatórias)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
DATABASE_URL=postgresql://postgres:[senha]@[host]:5432/postgres

# Google Maps (Obrigatória)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua-chave-google-maps

# Cron Jobs (Obrigatória para produção)
CRON_SECRET=seu-secret-aleatorio-gerado

# Email (Opcional - para relatórios agendados)
RESEND_API_KEY=re_sua-chave-resend
# ou
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=usuario@exemplo.com
SMTP_PASS=senha
SMTP_FROM=noreply@golffox.com
REPORTS_FROM_EMAIL=noreply@golffox.com
REPORTS_BCC=backup@golffox.com

# Base URL (Opcional)
NEXT_PUBLIC_BASE_URL=https://seu-dominio.vercel.app
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (porta 3000)

# Build e Deploy
npm run build           # Build para produção
npm start               # Inicia servidor de produção

# Qualidade de Código
npm run lint            # Executa ESLint
npm run lint:fix        # Corrige problemas de lint automaticamente
npm run type-check      # Verifica tipos TypeScript
npm run format          # Formata código com Prettier
npm run format:check    # Verifica formatação

# Testes
npm test                # Executa testes
npm run test:watch      # Executa testes em modo watch
npm run test:coverage   # Gera relatório de cobertura

# Banco de Dados
npm run db:check        # Valida migrações e drift do banco
npm run db:seed:demo    # Popula banco com dados de demonstração

# Outros
npm run clean           # Limpa arquivos de build
npm run analyze         # Analisa bundle size
npm run setup:env       # Configura variáveis de ambiente
```

### Migrations do Banco de Dados

O sistema agora usa migrations versionadas com controle automático. Execute:

```bash
npm run db:migrate
```

Isso aplicará automaticamente todas as migrations pendentes em ordem.

**Migrations existentes:**
- `000_schema_migrations.sql` - Sistema de controle de versão (aplicado automaticamente)
- `001_initial_schema.sql` - Schema inicial
- `002_missing_schema.sql` - Correções e adições
- `fix_supabase_issues.sql` - Correções específicas do Supabase

Para mais detalhes, consulte [database/migrations/README.md](database/migrations/README.md).

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
- Políticas por papel (admin, operador, transportadora, motorista, passageiro)
- Autenticação via Supabase Auth
- Validação de dados no frontend e backend
- Proteção LGPD de PII (CPF mascarado, logs sanitizados)
- Views seguras para isolamento multi-tenant
- Restrições de Google Maps API (HTTP referrer, quotas)

## 📊 Observabilidade

### Web Vitals
- Monitoramento automático de CLS, LCP, FID, TTFB
- Alertas para métricas com rating 'poor'
- Armazenamento de métricas no banco (`gf_web_vitals`)
- API `/api/analytics/web-vitals` para receber métricas

### Alertas Operacionais
- Monitoramento de erros de API (5xx)
- Alertas de falhas de cron jobs
- Alertas de falhas de sincronização
- Badge no sidebar com contador de alertas
- Sistema de severidade (info/warning/error/critical)

### Sincronização Supabase
- Retry automático com backoff exponencial (até 5 tentativas)
- Histórico completo de operações no localStorage
- Reprocessamento de sincronizações falhas
- Monitor de status em tempo real
- Validação de dados antes da sincronização

## 🚀 Funcionalidades Avançadas

### Agendamento de Relatórios
- Configuração via UI (`ScheduleReportModal`)
- Cron jobs via Vercel (`vercel.json`)
- Envio automático por email (Resend/SMTP)
- Histórico de gerações (`gf_report_history`)
- Armazenamento no Supabase Storage

### Exportação de Dados
- CSV com encoding UTF-8 e separador decimal BR
- Excel (formato .xlsx)
- PDF (via window.print)
- PNG do mapa (via html2canvas)
- BOM UTF-8 para compatibilidade Excel

### Conciliação de Faturas
- Workflow completo: Pendente → Em Análise → Aprovado/Rejeitado
- Detecção automática de divergências (>5% ou >R$100)
- Export de relatórios de conciliação
- Logs de auditoria integrados

### Seeds e Validação
- Script `db:seed:demo` para dados de teste
- Script `db:check` para validação de migrações
- Dados realistas: 3 empresas, 12 rotas, 40 motoristas, 10 veículos, 30 dias de histórico

## 📊 Próximos Passos

### Setup Inicial
1. ✅ Executar migrations SQL no Supabase
2. ✅ Configurar variáveis de ambiente na Vercel
3. ✅ Testar integração Google Maps
4. ✅ Testar Realtime Supabase
5. ✅ Configurar cron jobs (CRON_SECRET)
6. ✅ Popular banco com dados de demo (`npm run db:seed:demo`)

### Validação
1. ✅ Validar migrações (`npm run db:check`)
2. ✅ Verificar RLS e isolamento multi-tenant
3. ✅ Testar agendamento de relatórios
4. ✅ Verificar alertas operacionais
5. ✅ Monitorar Web Vitals

### Melhorias Futuras
- [ ] Gamificação completa de motoristas (ranking mensal)
- [ ] Testes E2E completos (multi-tenant, conciliação)
- [ ] Otimizações adicionais de performance
- [ ] Dashboard de métricas de performance
- [ ] Integração com Sentry/Logtail (opcional)

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Cobertura de Testes
- ✅ Serviço de sincronização Supabase
- ✅ Utilitários de mapa
- ✅ KPIs e cálculos
- ✅ Custos
- ✅ E2E: Multi-tenant, conciliação, mapa, relatórios

## 📚 Documentação Adicional

- [Configuração de Ambiente](./docs/CONFIGURACAO-AMBIENTE.md)
- [Guia de Testes operador](./docs/GUIA-TESTES-operador.md)
- [Próximos Passos](./docs/PROXIMOS_PASSOS.md)

---

**Desenvolvido para GOLF FOX - Transport Management System**
