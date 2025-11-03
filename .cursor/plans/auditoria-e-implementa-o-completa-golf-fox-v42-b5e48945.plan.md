<!-- b5e48945-9d86-4c49-8add-430a28a8497d a8e2a395-b187-48a6-a303-8b0b3942bfdd -->
# Painel Operador GOLF FOX v42.6 - CORRIGIDO

## Contexto de Negócio (CRÍTICO)

**Operador** = Empresa-cliente que contrata o serviço GOLF FOX

**GOLF FOX (Admin)** = Homologa/aciona/contrata transportadoras e aloca veículos/motoristas

**Transportadoras** = Prestadores contratados pela GOLF FOX

### O Operador NUNCA:

- Cria transportadoras
- Faz contratos diretos com transportadoras
- Aloca veículos/motoristas

### O Operador SEMPRE:

- Solicita serviços à GOLF FOX (via tickets/requests)
- Gerencia seus funcionários
- Acompanha execução e desempenho
- Audita SLA/custos
- Visualiza prestadores alocados pela GOLF FOX (read-only)

---

## Stack Técnico

- **Frontend**: Next.js 15 (App Router), TypeScript estrito, Tailwind, Framer Motion, Radix UI
- **State**: Zustand (filtros, estado global)
- **Backend**: Supabase v2 (Auth, RLS, Postgres, Realtime, Storage)
- **APIs**: Google Maps (JS, Directions, Distance Matrix, Geocoding)
- **Deploy**: Vercel
- **Idioma**: 100% PT-BR
- **UX**: WCAG 2.1 AA, responsivo, 60 FPS

---

## Arquitetura de Páginas

### 1. `/operator` (Dashboard)

**Arquivo**: `web-app/app/operator/page.tsx`

**KPIs do Dia**:

- Viagens hoje/em andamento/concluídas
- Atrasos >5min
- Ocupação média
- **SLA D+0 GOLF FOX→Operador** (não SLA individual de transportadora)
- **Custo/dia faturado GOLF FOX** (não transportadora direta)

**Control Tower**:

- Atrasos, Desvios, Veículo parado, Socorro aberto
- Cards clicáveis para abrir detalhes

**Mapa Preview**:

- Link "Abrir Mapa Completo" → `/operator/rotas/mapa`

**Atividades Recentes**:

- Timeline de auditoria (solicitações, aprovações, mudanças)

**Dados**:

- View: `v_operator_dashboard_kpis(empresa_id)`
- Realtime: viagens ativas, alertas críticos

---

### 2. `/operator/funcionarios` (Funcionários)

**Arquivo**: `web-app/app/operator/funcionarios/page.tsx`

**Funcionalidades**:

- **Lista/busca**: nome, CPF, e-mail
- **Filtros**: ativo/inativo, sem rota, turno, centro de custo
- **Importar CSV**: validação Zod + geocodificação automática
- **CRUD completo**: criar, editar, desativar
- **Atribuir rota**: vincular a rota existente
- **Solicitar inclusão**: se não houver vaga, gera `gf_service_requests` para GOLF FOX

**Componentes**:

- `FuncionariosList.tsx`: Lista com busca e filtros
- `FuncionarioModal.tsx`: CRUD
- `ImportRHModal.tsx`: Importador CSV com preview e validação
- `GeocodingProgress.tsx`: Progresso de geocodificação
- `SolicitarInclusaoModal.tsx`: Criar solicitação para GOLF FOX quando não há vaga

**Schema CSV**:

```typescript
const EmployeeCSVSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().regex(/^\d{11}$/),
  email: z.string().email(),
  telefone: z.string().optional(),
  endereco: z.string().min(1),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  centro_custo: z.string().optional(),
  turno: z.enum(['manha', 'tarde', 'noite']).optional(),
})
```

**Dados**:

- Tabela: `gf_employee_company`
- View: `v_operator_employees(empresa_id, status)`
- RPC: `rpc_request_service(empresa_id, 'incluir_funcionario', payload)`

---

### 3. `/operator/rotas` (Rotas)

**Arquivo**: `web-app/app/operator/rotas/page.tsx`

**Funcionalidades**:

- **Catálogo**: rotas por turno/status
- **Criar Solicitação de Rota**:
  - Janela de horário (ex: 06:00-08:00)
  - Dias da semana
  - Origem (endereço da empresa)
  - Volume estimado de funcionários
  - Gera ticket para GOLF FOX aprovar
- **Gerar Pontos**: busca funcionários da empresa e cria proposta de paradas
- **Otimizar**: usa Google Directions/Distance Matrix para propor melhor rota
- **Enviar para aprovação GOLF FOX**: proposta vira `gf_service_requests`
- **Acompanhar status**: rascunho → enviado → em análise → aprovado/reprovado → em operação

**Workflow de Solicitação**:

1. Operador cria rascunho (local)
2. Gera pontos (funcionários)
3. Otimiza (Google)
4. Envia para GOLF FOX (`rpc_request_service`)
5. GOLF FOX analisa e aprova/reprova
6. Se aprovado, GOLF FOX aloca transportadora/veículo/motorista
7. Rota entra em operação

**Componentes**:

- `RotasList.tsx`: Catálogo com filtros
- `SolicitarRotaModal.tsx`: Criar solicitação de nova rota
- `GerarPontosModal.tsx`: Geração de pontos (preview)
- `OtimizarRotaModal.tsx`: Otimização com Google (preview)
- `StatusSolicitacao.tsx`: Badge e timeline de status
- `RouteActions.tsx`: Ver no mapa, editar, cancelar solicitação

**Dados**:

- Tabela: `routes` (read-only para operador após aprovação)
- Tabela: `gf_service_requests` (tipo='nova_rota')
- View: `v_operator_routes(empresa_id, daterange)`
- RPC: `rpc_request_service(empresa_id, 'nova_rota', payload)`
- RPC: `rpc_request_route_change(empresa_id, route_id, payload)`

**Navegação para Mapa**:

```typescript
router.push({
  pathname: '/operator/rotas/mapa',
  query: { route_id, lat, lng, zoom: 14 }
}, { scroll: false })
```

---

### 4. `/operator/rotas/mapa` (Mapa Avançado)

**Arquivo**: `web-app/app/operator/rotas/mapa/page.tsx`

**Requisitos Visuais** (ESPECIFICAÇÃO FECHADA):

**Polyline**:

- 4px #2E7D32 (verde escuro)
- Sombra: 6px preta atrás

**Marcadores SVG**:

- **Embarque**: círculo verde
  - Mobile: 24px
  - Desktop: 32px
- **Desembarque**: quadrado amarelo
  - Mobile: 24px
  - Desktop: 32px
- **Numeração**: badge branca sequencial (1, 2, 3...)

**Tooltips Persistentes**:

- Abrir no hover, não fechar automaticamente
- Conteúdo:
  - Nome do funcionário (negrito)
  - Endereço formatado
  - Horário 24h (HH:MM)
  - Observações (≤140 chars)
  - Ícone 20px à direita

**Barra Superior Fixa**:

- Tempo total da rota (HH:MM)
- Total de paradas
- **Veículo/Motorista alocado (read-only)** ← alocado pela GOLF FOX
- Status: em andamento, agendada, concluída

**Linha do Tempo**:

- Barra proporcional ao tempo total
- Indicador de progresso 16px
- "X% concluído"
- "HH:MM restantes"

**Hotspots Interativos**:

- Click no marcador: expandir detalhes
- Foto do funcionário 40px (se disponível)
- **Ações limitadas**: visualizar apenas, não editar alocação de veículo

**Filtros Flutuantes**:

- Empresa (se operador tiver múltiplas unidades)
- Rota (searchable select)
- Status (badges: verde/amarelo/vermelho/azul)

**Realtime**:

- Atualização de posições a cada 5s (via Supabase Realtime)
- Sincronização de status

**Performance**:

- <500ms TTI do módulo mapa
- 60 FPS
- Cache de tiles: 5min
- Clustering de marcadores próximos
- Debounce de zoom/pan: 300ms

**Navegação Avançada** (Rotas→Mapa):

- Transição: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Prefetch do bundle do mapa
- Persistência de filtros (Zustand + URL)
- Zoom automático com margem 20%

---

### 5. `/operator/prestadores` (Prestadores Alocados - READ-ONLY)

**Arquivo**: `web-app/app/operator/prestadores/page.tsx`

**IMPORTANTE**: Operador **NÃO cria nem edita** transportadoras. Apenas visualiza as que a GOLF FOX alocou.

**Funcionalidades**:

- **Lista read-only**: transportadoras alocadas pela GOLF FOX
- **Veículos alocados**: para rotas do operador
- **SLA agregado**:
  - Pontualidade
  - Disponibilidade
  - Cancelamentos
  - Incidentes
- **Ranking por período**: score composto
- **Histórico**: desempenho ao longo do tempo
- **Upload de incidente**: gera ticket para GOLF FOX (não altera transportadora)

**Componentes**:

- `PrestadoresList.tsx`: Lista read-only
- `PrestadorDetail.tsx`: Detalhes (SLA, veículos, rotas atendidas)
- `SLAChart.tsx`: Gráfico de desempenho
- `IncidentReport.tsx`: Reportar incidente (cria `gf_service_requests`)

**Dados**:

- View: `v_operator_assigned_carriers(empresa_id)` (read-only)
- View: `v_operator_carrier_sla(empresa_id, carrier_id, period)`
- RPC: `rpc_raise_incident(empresa_id, rota_id, tipo, severidade, descricao)`

**Schema View**:

```sql
CREATE OR REPLACE VIEW v_operator_assigned_carriers AS
SELECT 
  ac.empresa_id,
  c.id as carrier_id,
  c.name as carrier_name,
  ac.period_start,
  ac.period_end,
  ac.notes,
  -- SLAs agregados
  AVG(cs.punctuality_score) as avg_punctuality,
  AVG(cs.availability_score) as avg_availability,
  SUM(cs.incident_count) as total_incidents
FROM gf_assigned_carriers ac
JOIN companies c ON c.id = ac.carrier_id
LEFT JOIN gf_carrier_scores cs ON cs.carrier_id = ac.carrier_id
WHERE c.role = 'carrier'
GROUP BY ac.empresa_id, c.id, c.name, ac.period_start, ac.period_end, ac.notes;
```

---

### 6. `/operator/solicitacoes` (Solicitações & Mudanças)

**Arquivo**: `web-app/app/operator/solicitacoes/page.tsx`

**Funcionalidades**:

- **Abrir solicitação para GOLF FOX**:
  - Nova rota
  - Alteração de janela/turno
  - Reforço de frota
  - Cancelamento pontual
  - Socorro
- **Kanban de status**:
  - Rascunho
  - Enviado
  - Em análise
  - Aprovado
  - Reprovado
  - Em operação
- **SLA de atendimento GOLF FOX**: tempo médio de resposta
- **Linha do tempo**: histórico de mudanças
- **Notificações**: quando GOLF FOX responde

**Componentes**:

- `SolicitacoesList.tsx`: Lista com filtros
- `SolicitacaoModal.tsx`: Criar nova solicitação
- `KanbanBoard.tsx`: Visualização kanban
- `SLAIndicator.tsx`: Indicador de SLA GOLF FOX
- `TimelineView.tsx`: Timeline de mudanças

**Dados**:

- Tabela: `gf_service_requests`
- View: `v_operator_requests(empresa_id, status)`
- RPC: `rpc_request_service(empresa_id, tipo, payload)`

**Schema `gf_service_requests`**:

```sql
CREATE TABLE IF NOT EXISTS gf_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'nova_rota', 'alteracao', 'reforco', 'cancelamento', 'socorro'
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'rascunho', -- 'rascunho', 'enviado', 'em_analise', 'aprovado', 'reprovado', 'em_operacao'
  sla_target TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id), -- Admin GOLF FOX que está analisando
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

---

### 7. `/operator/custos` (Custos & Faturas)

**Arquivo**: `web-app/app/operator/custos/page.tsx`

**Funcionalidades**:

- **Custo consolidado**: por rota, turno, centro de custo, período
- **Fatura GOLF FOX**: valor total cobrado
- **Conciliação**: medido (km/tempo/viagens) vs faturado GOLF FOX
- **Apontar divergências**: destacar diferenças
- **Aprovar/Reprovar fatura**: fluxo de aprovação
- **Exportar**: CSV/Excel/PDF

**Componentes**:

- `CustosDashboard.tsx`: Visão consolidada
- `FaturasList.tsx`: Lista de faturas GOLF FOX
- `ConciliarFaturaModal.tsx`: Conciliação
- `DivergenciasPanel.tsx`: Apontar e discutir divergências
- `AprovarFaturaModal.tsx`: Fluxo de aprovação
- `ExportCustos.tsx`: Export

**Dados**:

- Tabela: `gf_invoices` (fatura_golffox → operador)
- Tabela: `gf_invoice_lines` (detalhamento)
- View: `v_operator_costs(empresa_id, daterange)`
- RPC: `rpc_invoice_reconcile(invoice_id)`

**Schema Faturas**:

```sql
CREATE TABLE IF NOT EXISTS gf_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL, -- Operador
  invoice_number VARCHAR(50) UNIQUE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reconciled', 'approved', 'rejected', 'paid'
  reconciled_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gf_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES gf_invoices(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  description TEXT,
  measured_km NUMERIC,
  invoiced_km NUMERIC,
  measured_time INTEGER, -- minutes
  invoiced_time INTEGER,
  measured_trips INTEGER,
  invoiced_trips INTEGER,
  unit_price NUMERIC,
  amount NUMERIC NOT NULL,
  discrepancy NUMERIC, -- diferença
  notes TEXT
);
```

---

### 8. `/operator/alertas` (Alertas)

**Arquivo**: `web-app/app/operator/alertas/page.tsx`

**Funcionalidades**:

- **Feed unificado**: crítico/aviso/info
- **Filtros**: tipo, rota, período, severidade
- **Regras visíveis**:
  - Atraso 5min, 10min, 15min
  - Desvio de rota
  - Veículo parado >X minutos
  - Não embarcados
  - Incidente reportado
- **Exportar**: CSV/Excel/PDF
- **Ações**: marcar como lido, criar solicitação para GOLF FOX

**Componentes**:

- `AlertasFeed.tsx`: Feed com filtros
- `AlertaCard.tsx`: Card individual
- `RegrasAlertasInfo.tsx`: Informação sobre regras
- `ExportAlertas.tsx`: Export

**Dados**:

- Tabela: `gf_alerts` (reusar existente, filtrado por empresa)
- View: `v_operator_alerts(empresa_id, daterange)`

---

### 9. `/operator/relatorios` (Relatórios)

**Arquivo**: `web-app/app/operator/relatorios/page.tsx`

**Relatórios Disponíveis**:

1. **Atrasos**: por rota/turno
2. **Ocupação**: heatmap por horário/rota
3. **Não embarcados**: motivos e frequência
4. **Eficiência**: planejado vs realizado
5. **SLA GOLF FOX**: pontualidade de resposta a solicitações
6. **ROI**:

   - Custo por colaborador
   - Tempo economizado
   - CO₂ estimado (opcional)

**Funcionalidades**:

- **Filtros**: período, rota, turno
- **Visualização**: gráficos interativos
- **Exportar**: CSV/Excel/PDF
- **Agendar**: envio por e-mail (mensal/semanal)

**Componentes**:

- `RelatoriosCatalog.tsx`: Catálogo
- `RelatorioViewer.tsx`: Visualizador com gráficos
- `ExportRelatorio.tsx`: Export
- `AgendarRelatorio.tsx`: Agendamento

**Dados**:

- Views: várias views `v_operator_*` conforme necessário

---

### 10. `/operator/conformidade` (Conformidade & Segurança)

**Arquivo**: `web-app/app/operator/conformidade/page.tsx`

**Funcionalidades**:

- **Incidentes**: registro (tipo, causa, ação), status
- **Auditorias simples**: checklists internos
- **Documentos da empresa**: políticas internas (upload)
- **Alertas de validade**: documentos vencendo

**Componentes**:

- `IncidentesList.tsx`: Lista de incidentes
- `RegistrarIncidenteModal.tsx`: Criar incidente (gera ticket para GOLF FOX)
- `AuditoriasList.tsx`: Checklists
- `DocumentosManager.tsx`: Gestão de documentos

**Dados**:

- Tabela: `gf_operator_incidents`
- Tabela: `gf_operator_audits`
- Tabela: `gf_operator_documents`

---

### 11. `/operator/comunicacoes` (Comunicações)

**Arquivo**: `web-app/app/operator/comunicacoes/page.tsx`

**Funcionalidades**:

- **Broadcast**: para grupos (empresa, rota, turno)
- **Templates**: manhã/turno/noite, contingência
- **Histórico**: envios anteriores
- **Taxa de leitura**: quando disponível
- **Pré-integração WhatsApp/Webhooks**: conectores preparados

**Componentes**:

- `BroadcastList.tsx`: Lista de broadcasts
- `CriarBroadcastModal.tsx`: Criar novo
- `TemplatesManager.tsx`: Gestão de templates
- `HistoricoEnvios.tsx`: Histórico

**Dados**:

- Tabela: `gf_announcements`
- Tabela: `gf_announcement_templates`

---

### 12. `/operator/preferencias` (Preferências & Integrações)

**Arquivo**: `web-app/app/operator/preferencias/page.tsx`

**Funcionalidades**:

- **Turnos padrão**: configurar horários
- **Tolerâncias**: atraso, tempo máximo de espera
- **Centros de custo**: cadastrar e gerenciar
- **Feriados corporativos**: cadastrar feriados da empresa
- **Conectores**: RH/SSO/Webhooks/API Keys

**Componentes**:

- `TurnosPadrao.tsx`: Configuração de turnos
- `Tolerancias.tsx`: Políticas de tolerância
- `CentrosCusto.tsx`: Gestão de centros de custo
- `FeriadosCorporativos.tsx`: Cadastro de feriados
- `Conectores.tsx`: Integrações

**Dados**:

- Tabela: `gf_operator_settings`
- Tabela: `gf_cost_centers`
- Tabela: `gf_holidays`

---

## Componentes Compartilhados

### Reaproveitar do Admin (com variant="operator")

- `AppShell.tsx`: Adicionar variant="operator"
- `Topbar.tsx`: Badge "Operador" (não "Admin • Premium")
- `Sidebar.tsx`: Menu operator (12 itens, highlight laranja)
- `FleetMap.tsx`: Base para `OperatorFleetMap.tsx`
- `export-utils.ts`: Funções de export

### Novos Componentes

- `components/operator/`: Pasta específica
- `hooks/use-operator-filters.ts`: Filtros persistentes
- `stores/operator-filters.ts`: Store Zustand

---

## Modelo de Dados (Supabase) - CORRIGIDO

### Tabelas Novas/Ajustes

**`gf_operator_settings`**:

```sql
CREATE TABLE IF NOT EXISTS gf_operator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) UNIQUE NOT NULL,
  turnos_padrao JSONB, -- {manha: {inicio, fim}, tarde: {...}, noite: {...}}
  tolerancias JSONB, -- {atraso_max: 10, espera_max: 15}
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`gf_cost_centers`** (já definido acima)

**`gf_service_requests`** (já definido acima)

**`gf_operator_incidents`**:

```sql
CREATE TABLE IF NOT EXISTS gf_operator_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL,
  route_id UUID REFERENCES routes(id),
  tipo VARCHAR(50) NOT NULL, -- 'atraso', 'desvio', 'veículo_quebrado', 'motorista', 'outro'
  severidade VARCHAR(20) DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
  descricao TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'aberto', -- 'aberto', 'em_analise', 'resolvido', 'fechado'
  created_by UUID REFERENCES users(id),
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

**`gf_invoices` e `gf_invoice_lines`** (já definidos acima)

**`gf_assigned_carriers`** (nova - mapping read-only):

```sql
CREATE TABLE IF NOT EXISTS gf_assigned_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES companies(id) NOT NULL, -- Operador
  carrier_id UUID REFERENCES companies(id) NOT NULL, -- Transportadora
  period_start DATE NOT NULL,
  period_end DATE,
  notes TEXT,
  assigned_by UUID REFERENCES users(id), -- Admin GOLF FOX
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, carrier_id, period_start)
);
```

**`gf_announcements`, `gf_holidays`** (já definidos)

**`gf_audit_log`** (já definido)

### Views (Somente Leitura para Operador)

**`v_operator_dashboard_kpis(empresa_id)`** (já definido)

**`v_operator_routes(empresa_id, daterange)`**:

```sql
CREATE OR REPLACE VIEW v_operator_routes AS
SELECT 
  r.id,
  r.name,
  r.origin,
  r.destination,
  r.company_id as empresa_id,
  r.is_active,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_trips,
  -- Agregado de SLA
  AVG(EXTRACT(EPOCH FROM (t.actual_arrival - t.scheduled_arrival))/60) FILTER (WHERE t.status = 'completed') as avg_delay_minutes
FROM routes r
LEFT JOIN trips t ON t.route_id = r.id
GROUP BY r.id;
```

**`v_operator_alerts(empresa_id, daterange)`**:

```sql
CREATE OR REPLACE VIEW v_operator_alerts AS
SELECT 
  a.id,
  a.type,
  a.severity,
  a.message,
  a.route_id,
  r.company_id as empresa_id,
  a.created_at
FROM gf_alerts a
LEFT JOIN routes r ON r.id = a.route_id
WHERE a.created_at >= NOW() - INTERVAL '30 days';
```

**`v_operator_costs(empresa_id, daterange)`**:

```sql
CREATE OR REPLACE VIEW v_operator_costs AS
SELECT 
  r.company_id as empresa_id,
  r.id as route_id,
  r.name as route_name,
  DATE_TRUNC('month', il.created_at) as period,
  SUM(il.amount) as total_cost,
  SUM(il.discrepancy) as total_discrepancy
FROM gf_invoice_lines il
JOIN gf_invoices i ON i.id = il.invoice_id
JOIN routes r ON r.id = il.route_id
GROUP BY r.company_id, r.id, r.name, DATE_TRUNC('month', il.created_at);
```

**`v_operator_assigned_carriers(empresa_id)`** (já definido acima)

**`v_operator_sla(empresa_id, period)`**:

```sql
CREATE OR REPLACE VIEW v_operator_sla AS
SELECT 
  r.company_id as empresa_id,
  DATE_TRUNC('month', t.scheduled_at) as period,
  COUNT(DISTINCT t.id) as total_trips,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.actual_arrival <= t.scheduled_arrival + INTERVAL '5 minutes') as on_time_trips,
  (COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.actual_arrival <= t.scheduled_arrival + INTERVAL '5 minutes')::NUMERIC / 
   NULLIF(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)) * 100 as sla_percentage
FROM trips t
JOIN routes r ON r.id = t.route_id
GROUP BY r.company_id, DATE_TRUNC('month', t.scheduled_at);
```

### RPCs (Entrada do Operador)

**`rpc_request_service`**:

```sql
CREATE OR REPLACE FUNCTION rpc_request_service(
  p_empresa UUID,
  p_tipo TEXT,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO gf_service_requests (empresa_id, tipo, payload, status)
  VALUES (p_empresa, p_tipo, p_payload, 'enviado')
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`rpc_request_route_change`**:

```sql
CREATE OR REPLACE FUNCTION rpc_request_route_change(
  p_empresa UUID,
  p_route UUID,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO gf_service_requests (empresa_id, tipo, payload, status)
  VALUES (p_empresa, 'alteracao_rota', jsonb_build_object('route_id', p_route, 'changes', p_payload), 'enviado')
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`rpc_raise_incident`**:

```sql
CREATE OR REPLACE FUNCTION rpc_raise_incident(
  p_empresa UUID,
  p_rota UUID,
  p_tipo TEXT,
  p_severidade TEXT,
  p_descricao TEXT
) RETURNS UUID AS $$
DECLARE
  v_incident_id UUID;
BEGIN
  INSERT INTO gf_operator_incidents (empresa_id, route_id, tipo, severidade, descricao, status)
  VALUES (p_empresa, p_rota, p_tipo, p_severidade, p_descricao, 'aberto')
  RETURNING id INTO v_incident_id;
  
  -- Criar service request para GOLF FOX
  INSERT INTO gf_service_requests (empresa_id, tipo, payload, status, priority)
  VALUES (p_empresa, 'incidente', jsonb_build_object('incident_id', v_incident_id), 'enviado', 'alta');
  
  RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`rpc_invoice_reconcile`** (já definido)

### RLS (Row Level Security)

**Essenciais**:

- Operador vê apenas dados da sua `empresa_id`
- Operador pode `SELECT` em:
  - `routes` (suas rotas)
  - `trips` (suas viagens)
  - `gf_employee_company` (seus funcionários)
  - `gf_service_requests` (suas solicitações)
  - `gf_invoices`, `gf_invoice_lines` (suas faturas)
  - Views `v_operator_*`
- Operador pode `INSERT` em:
  - `gf_service_requests`
  - `gf_operator_incidents`
  - `gf_employee_company`
- Operador **NÃO** pode `INSERT/UPDATE/DELETE` em:
  - `companies` (role='carrier')
  - `vehicles` (alocados)
  - `users` (motoristas)
  - `gf_assigned_carriers` (read-only)

**Exemplo RLS**:

```sql
-- Operador vê apenas suas rotas
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY operator_select_routes ON routes
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Operador pode criar service requests
ALTER TABLE gf_service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY operator_insert_service_requests ON gf_service_requests
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Operador vê apenas assigned carriers da sua empresa
ALTER TABLE gf_assigned_carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY operator_select_assigned_carriers ON gf_assigned_carriers
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );
```

---

## UX/UI (Variant "operator")

### Sidebar

- 12 itens (ícones lucide 1.5)
- Highlight laranja (não verde como admin)
- Badge "Operador" no topo (não "Admin • Premium")

### Cards

- Glass sutil, bordas 20-24px
- Microinterações: hover-lift, press-scale
- Animações 60 FPS

### Busca Global

- ⌘/Ctrl+K
- Busca em funcionários, rotas, solicitações

### Acessibilidade

- WCAG 2.1 AA
- Aria-labels completos
- Contraste ≥4.5:1
- Navegação por teclado

### Responsividade

- Desktop: ≥1280px (grid 3-4 colunas)
- Tablet: 768-1279px (grid 2 colunas)
- Mobile: <768px (stack vertical)

---

## O que é Read-Only vs Solicitação

### Read-Only para Operador

- **Transportadoras alocadas**: visualização apenas
- **Veículo/Motorista atribuído**: ver quem está alocado
- **SLAs dos prestadores**: desempenho agregado
- **Contratos GOLF FOX↔Carriers**: não tem acesso

### Ações do Operador (via Solicitação)

- Importar/gerir funcionários
- Solicitar novas rotas/mudanças/reforços
- Abrir incidentes e socorro
- Conciliar faturas GOLF FOX
- Broadcasts internos

---

## Ordem de Implementação

1. **Estrutura base**: Rotas, variant operator em AppShell/Topbar/Sidebar, store Zustand
2. **Migrações**: Criar tabelas `gf_service_requests`, `gf_assigned_carriers`, etc.
3. **Views e RPCs**: Criar views read-only e RPCs de entrada
4. **RLS**: Configurar policies para operador
5. **Dashboard**: KPIs, control tower, mapa preview
6. **Funcionários**: CRUD, importador, geocoding, solicitar inclusão
7. **Rotas**: Solicitar rota, gerar pontos, otimizar, acompanhar status
8. **Mapa avançado**: Especificação completa (polyline, SVGs, tooltips, realtime)
9. **Prestadores**: Read-only, SLA, reportar incidente
10. **Solicitações**: Kanban, timeline, SLA GOLF FOX
11. **Custos**: Dashboard, conciliação, aprovação
12. **Alertas/Relatórios**: Feed, export, agendamento
13. **Conformidade/Comunicações/Preferências**
14. **Testes**: Unit (Vitest) e E2E (Playwright)
15. **Documentação**: README-OPERATOR.md, health check

---

## Critérios de Aceite

- [ ] Operador **NÃO cria/edita transportadoras** nem contratos com elas
- [ ] Todo pedido do Operador vira `gf_service_requests` com SLA GOLF FOX
- [ ] Mapa avançado e navegação conforme especificação fechada
- [ ] Importador RH funcional com geocoding
- [ ] Geração de pontos + otimização como proposta (envio para aprovação GOLF FOX)
- [ ] Prestadores read-only com SLAs agregados
- [ ] Conciliação de fatura GOLF FOX (medido vs faturado)
- [ ] RLS correta: operador só vê seus dados e prestadores alocados
- [ ] Performance (60 FPS), acessibilidade (WCAG 2.1 AA), responsividade
- [ ] Deploy Vercel verde
- [ ] 100% PT-BR

---

## Few-Shot (Exemplos Rápidos)

### Rotas → Mapa (push com estado persistido)

```typescript
router.push({
  pathname: '/operator/rotas/mapa',
  query: { route_id, lat, lng, zoom: 14 }
}, { scroll: false })
```

### Abrir solicitação de nova rota para GOLF FOX

```sql
SELECT rpc_request_service(
  :empresa_id,
  'nova_rota',
  jsonb_build_object(
    'turno', 'manha',
    'janela', '06:00-08:00',
    'dias', ARRAY['seg','ter','qua','qui','sex'],
    'volume_previsto', 42
  )
);
```

### View prestadores alocados (read-only)

```sql
CREATE OR REPLACE VIEW v_operator_assigned_carriers AS
SELECT empresa_id, carrier_id, period_start, period_end, notes
FROM gf_assigned_carriers;
```

---

## Documentação

### `README-OPERATOR.md`

- Visão geral do painel operador
- Diferença entre Operador e Admin
- Guia de uso rápido
- Screenshots das telas

### Script de Verificação

**Arquivo**: `web-app/scripts/health-check-operator.ts`

- Verificar env vars
- Testar conexões (Supabase, Google Maps)
- Verificar views, RPCs e RLS policies
- Validar que operador não tem acesso a dados de admin

### To-dos

- [ ] Adicionar @ts-ignore para imports com @/ em web-app/app/operator/page.tsx
- [ ] Adicionar @ts-ignore para imports com @/ em web-app/app/operator/ajuda/page.tsx
- [ ] Adicionar @ts-ignore para imports com @/ em web-app/app/operator/alertas/page.tsx
- [ ] Adicionar @ts-ignore para imports com @/ em web-app/app/operator/funcionarios/page.tsx
- [ ] Adicionar @ts-ignore para imports com @/ em web-app/app/operator/sincronizar/page.tsx (incluindo @/lib/google-maps)
- [ ] Adicionar @ts-ignore para imports com @/ em web-app/app/operator/rotas/page.tsx
- [ ] Fazer commit e push de todas as correções do operator panel