# Verificação de Views de Relatórios

## Data: 2025-01-11

## Status das Views

### ✅ Views Criadas com Sucesso

Todas as 5 views de relatórios foram criadas com sucesso:

1. ✅ **v_reports_delays** - 6 registros
2. ✅ **v_reports_occupancy** - 2 registros
3. ✅ **v_reports_not_boarded** - 0 registros (vazia, mas criada)
4. ✅ **v_reports_efficiency** - 2 registros
5. ✅ **v_reports_driver_ranking** - 2 registros

### ✅ Colunas Verificadas

Todas as views possuem as colunas esperadas pelos endpoints:

#### v_reports_delays
- ✅ company_id
- ✅ route_id
- ✅ route_name
- ✅ driver_id
- ✅ driver_name
- ✅ trip_date
- ✅ scheduled_time
- ✅ actual_time
- ✅ delay_minutes
- ✅ status

#### v_reports_occupancy
- ✅ company_id
- ✅ route_id
- ✅ route_name
- ✅ trip_date
- ✅ time_slot
- ✅ total_passengers
- ✅ capacity
- ✅ occupancy_rate

#### v_reports_not_boarded
- ✅ company_id
- ✅ route_id
- ✅ route_name
- ✅ passenger_id
- ✅ passenger_name
- ✅ trip_date
- ✅ scheduled_time
- ✅ reason

#### v_reports_efficiency
- ✅ company_id
- ✅ route_id
- ✅ route_name
- ✅ period_start
- ✅ period_end
- ✅ total_trips
- ✅ completed_trips
- ✅ efficiency_rate
- ✅ avg_delay

#### v_reports_driver_ranking
- ✅ company_id
- ✅ driver_id
- ✅ driver_name
- ✅ routes_completed
- ✅ punctuality_score
- ✅ efficiency_score
- ✅ total_score
- ✅ ranking

## Dados nas Views

### Dados Existentes
- **v_reports_delays**: 6 registros de viagens com informações de atrasos
- **v_reports_occupancy**: 2 registros de ocupação por horário
- **v_reports_efficiency**: 2 registros de eficiência de rotas
- **v_reports_driver_ranking**: 2 registros de ranking de motoristas

### Dados Faltantes
- **v_reports_not_boarded**: 0 registros (view vazia, mas funcionando corretamente)

## Ajustes Realizados

### 1. Estrutura da Tabela trip_passengers
A tabela `trip_passengers` no banco de dados possui apenas:
- `trip_id` (UUID)
- `passenger_id` (UUID)

Não possui:
- ❌ `id` (chave primária)
- ❌ `status` (status do passageiro)
- ❌ Outras colunas opcionais

### 2. Views Ajustadas
As views foram ajustadas para:
- Não depender de colunas que não existem (`tp.id`, `tp.status`)
- Usar apenas `trip_id` e `passenger_id` da tabela `trip_passengers`
- Lidar com valores NULL de forma adequada
- Retornar dados mesmo quando não há passageiros associados

## Scripts Criados

### 1. `database/scripts/create_report_views_fixed.sql`
Script SQL para criar todas as views de relatórios com a estrutura correta.

### 2. `database/scripts/check_report_views.js`
Script Node.js para verificar e criar views automaticamente.

### 3. `database/scripts/test_report_views.js`
Script Node.js para testar as views e verificar colunas.

### 4. `database/scripts/check_trip_passengers_structure.js`
Script Node.js para verificar a estrutura real da tabela `trip_passengers`.

## Próximos Passos

### ✅ Concluído
1. ✅ Verificar estrutura das tabelas
2. ✅ Criar views de relatórios
3. ✅ Verificar colunas esperadas
4. ✅ Testar views com dados existentes
5. ✅ Recarregar cache do schema do Supabase

### ⏭️ Pendente
1. ⏭️ Testar endpoints manualmente em produção
2. ⏭️ Popular views com dados de teste adicionais (se necessário)
3. ⏭️ Verificar se endpoints retornam dados corretamente

## Notas Técnicas

### Cache do Schema
O cache do schema do Supabase foi recarregado, mas pode levar alguns minutos para ser atualizado completamente.

### Views Vazias
A view `v_reports_not_boarded` está vazia porque:
- Não há passageiros não embarcados nos dados existentes
- A view está funcionando corretamente, apenas não há dados para exibir

### Dados de Teste
Os dados existentes nas views são baseados em:
- 6 viagens (trips) existentes no banco
- 41 rotas (routes) existentes no banco
- 6 veículos (vehicles) existentes no banco
- 6 usuários (users) existentes no banco
- 0 passageiros em viagens (trip_passengers) - por isso algumas views estão vazias

## Comandos Úteis

### Verificar Views
```bash
node database/scripts/check_report_views.js
```

### Testar Views
```bash
node database/scripts/test_report_views.js
```

### Recarregar Cache
```bash
node database/scripts/reload_schema_cache.js
```

### Testar Endpoints
```bash
cd web-app
node test_report_endpoints.js
```

## Referências

- Migração original: `database/migrations/v43_admin_views.sql`
- Script de criação: `database/scripts/create_report_views_fixed.sql`
- Endpoint de relatórios: `web-app/app/api/reports/run/route.ts`

