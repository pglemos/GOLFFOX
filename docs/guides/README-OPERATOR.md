# Painel do Gestor da Empresa - Multi-tenant

Documentação completa do painel do gestor da empresa multi-tenant do GOLFFOX.

## Visão Geral

O painel do gestor da empresa (`/empresa`, anteriormente `/operador`) é uma aplicação 100% multi-tenant que permite que gestores gerenciem a operação de transporte de uma ou mais empresas clientes. Todos os dados são isolados por `company_id` através de Row Level Security (RLS) e views seguras.

**Nota**: O role foi renomeado de `operador` para `gestor_empresa` em 2025-01-29 para melhor refletir a função do papel.

Nota de links: todas as URLs absolutas devem apontar para `https://golffox.vercel.app/empresa` sem o parâmetro `company`. Qualquer acesso com `?company=` é automaticamente normalizado (middleware) preservando demais parâmetros de query.

## Arquitetura Multi-tenant

### Modelo de Dados

- **`gf_user_company_map`**: Tabela de mapeamento usuário ↔ empresa (suporta múltiplas empresas por operador)
- **`gf_company_branding`**: Configuração de branding por empresa (logo, cores)
- **Função `company_ownership()`**: Verifica se o usuário autenticado tem acesso à empresa

### Segurança (RLS)

Todas as tabelas do operador têm RLS ativo com policies:
- `SELECT`: Apenas dados da empresa do tenant selecionado
- `INSERT/UPDATE/DELETE`: Com `WITH CHECK` garantindo que o `company_id` pertence ao usuário

### Views Seguras

- `v_my_companies`: Lista empresas acessíveis pelo usuário
- `v_operator_dashboard_kpis_secure`: KPIs filtrados por empresa
- `v_operator_routes_secure`: Rotas filtradas
- `v_operator_alerts_secure`: Alertas filtrados
- `v_operator_costs_secure`: Custos filtrados
- `v_reports_*_secure`: Relatórios filtrados (delays, occupancy, etc.)

### Materialized Views

- `mv_operator_kpis`: Cache de KPIs (refresh a cada 5 minutos via Vercel Cron)

## Migrations

Execute as migrations na seguinte ordem:

```bash
# 1. Tabela de mapeamento usuário↔empresa
psql $DATABASE_URL -f database/migrations/v43_gf_user_company_map.sql

# 2. Função utilitária para RLS
psql $DATABASE_URL -f database/migrations/v43_company_ownership_function.sql

# 3. Tabela de branding
psql $DATABASE_URL -f database/migrations/v43_company_branding.sql

# 4. RLS completo
psql $DATABASE_URL -f database/migrations/v43_operator_rls_complete.sql

# 5. Views seguras
psql $DATABASE_URL -f database/migrations/v43_operator_secure_views.sql

# 6. Materialized views
psql $DATABASE_URL -f database/migrations/v43_operator_kpi_matviews.sql

# 7. Cache de otimização
psql $DATABASE_URL -f database/migrations/v43_route_optimization_cache.sql

# 8. Agendamento de relatórios
psql $DATABASE_URL -f database/migrations/v43_report_scheduling.sql
```

## Provider de Tenant

O `OperatorTenantProvider` gerencia:
- Carregamento de empresas acessíveis
- Seleção de empresa ativa (prioridade: `?company=` > localStorage > primeira empresa)
- Persistência em localStorage e URL
- Branding dinâmico (logo, cores)

### Uso

```typescript
import { useOperatorTenant } from '@/components/providers/operador-tenant-provider'

function MyComponent() {
  const { tenantCompanyId, companyName, logoUrl, switchTenant } = useOperatorTenant()
  
  // Usar tenantCompanyId em todas as queries
  const { data } = await supabase
    .from('v_operator_routes_secure')
    .select('*')
    .eq('company_id', tenantCompanyId)
}
```

## Funcionalidades

### Dashboard (`/operador`)

- **KPIs em tempo real**: Viagens hoje, em andamento, concluídas, atrasos >5min, ocupação média, custo/dia, SLA D+0
- **Torre de Controle**: Cards clicáveis para alertas (atrasos, veículos parados, desvios, socorros)

### Funcionários (`/operador/funcionarios`)

- **Importação CSV PRO**:
  - Parse robusto com PapaParse
  - Validação com Zod
  - Geocoding em lote com rate limiting (8-10 req/s)
  - Retry exponencial
  - Preview antes de importar
  - Relatório pós-importação (sucesso, erros, endereços não resolvidos)

### Rotas (`/operador/rotas`)

- Lista de rotas com filtros (turno, status, período)
- Ações rápidas: Gerar Pontos, Otimizar, Ver no Mapa
- Otimização via Google Directions + Distance Matrix (cached)

### Mapa (`/operador/rotas/mapa`)

- Polyline 4px #2E7D32 com sombra
- Markers SVG: círculo (embarque), quadrado (desembarque), numerados
- Tooltips persistentes (nome, endereço, horário 24h, observação)
- Barra superior fixa: tempo total, paradas, veículo/motorista, status
- Timeline e progresso: "% concluído", "HH:MM restantes"
- Auto-zoom com 20% de margem
- Realtime: atualização a cada 5s com debounce 300ms
- Clustering quando >50 markers

### Custos (`/operador/custos`)

- Visualização de custos via `v_operator_costs_secure`
- Modal de conciliação:
  - Compara medido vs faturado
  - Flag para divergências >5% ou >R$100
  - Ações: Aprovar, Rejeitar, Solicitar Revisão
- Gráficos (Recharts): evolução mensal, breakdown por rota/veículo/motorista
- Export (CSV/Excel/PDF) com logo/nome da empresa

### Relatórios (`/operador/relatorios`)

- Catálogo de relatórios disponíveis
- Agendamento via cron
- Execução manual ("Executar agora")
- Histórico de relatórios enviados
- Envio automático por email (Resend/SMTP)

## Internacionalização (i18n)

Todos os textos estão em `web-app/i18n/operador.json` (PT-BR).

**Não há nenhuma string "GOLF FOX" na UI** (exceto rodapé legal quando obrigatório).

## Performance

- **TTFB < 300ms** em `/operador`
- **60 FPS** em interações de mapa e listas
- **First content < 1.5s** (prod)
- Lazy loading de mapas/relatórios/gráficos
- Virtualização (react-window) para listas grandes
- Debounce em inputs e updates realtime

## Observabilidade

Logs estruturados incluem:
- `tenantCompanyId`
- `companyName`
- `action`
- `resourceId`
- `userId`
- `duration`

## Testes

### Unit (Vitest)

```bash
npm run test:unit
```

Testes cobrem:
- Importador CSV (parsing/validação)
- Utils de mapa (fitBounds com 20%)
- Cálculo de KPIs (guarda contra divisão por zero)

### E2E (Playwright)

```bash
npm run test:e2e
```

Testes E2E cobrem:
- Isolamento multi-tenant (Operador A não vê dados de Empresa Y)
- Fluxo de importação CSV (dry-run → sucesso)
- Rotas → Mapa (zoom 20%, tooltip persistente, timeline)
- Conciliação (detectar divergência, aprovar)

## Vercel Cron

Configurar em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-kpis",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/reports/dispatch",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

Variáveis de ambiente necessárias:
- `CRON_SECRET`: Secret para autenticar requests de cron
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Chave da API do Google Maps
- `NEXT_PUBLIC_SUPABASE_URL`: URL do Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anon do Supabase

## Checklist de Aceite

- ✅ Nenhuma string "GOLF FOX" na UI (exceto rodapé legal)
- ✅ Todas as queries usam `*_secure` ou `company_ownership()`
- ✅ URLs do operador normalizadas (sem `?company=`); rollback documentado em `database/migrations/20251107_update_operator_links.sql`
- ✅ Policies RLS SELECT/INSERT/UPDATE/DELETE ativas
- ✅ KPIs via materialized view atualizada via Cron
- ✅ Importador RH robusto (PapaParse + Zod + geocoding + relatório)
- ✅ Mapa premium completo (polyline, markers, tooltips, timeline, clustering)
- ✅ Custos & conciliação funcionando
- ✅ Relatórios agendados com histórico e email
- ✅ Playwright verde (todos os testes E2E passando)
- ✅ Build Vercel verde (sem erros)

## Suporte

Para dúvidas ou problemas, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.
