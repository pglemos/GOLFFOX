# Integração do Gerador de Pontos com Modal de Rotas

Este documento descreve a arquitetura, endpoints e fluxo de integração do gerador de pontos com o Modal de Rotas.

## Diagrama de Sequência (simplificado)

```
UI (RouteModal)        API (generate-stops)         Supabase
    | Click "Gerar"          |                         |
    |------------------------>| POST /generate-stops    |
    |                         | valida -> geocodifica   |
    |                         | ordena -> gfRoutePlan   |
    |                         | (dbSave=true)           |
    |                         | insert gf_route_plan --->
    |                         |                         |
    |<------------------------| 200 + payload           |
    | assina Realtime gf_route_plan                     |
    | recebe eventos -> debounce -> onGenerateStops     |
```

## Endpoint

- `POST /api/admin/generate-stops`
  - Body:
    - `routeId` (string) obrigatório
    - `avgSpeedKmh` (number) opcional
    - `employeeDb` (string) opcional (ex.: `gf_employee_company`)
    - `itemsPerPage` (number) opcional
    - `dbSave` (boolean) opcional (salva em `gf_route_plan` via service role)
    - `tableName` (string) opcional (default `gf_route_plan`)
  - Resposta: JSON com `stops`, `validation`, `geocoded`, `metrics`, `logs` e `gfRoutePlan` (payload pronto para inserir).

## Manual de Integração

- No `RouteModal`, configure:
  - Fonte de funcionários (tabela Supabase)
  - Velocidade média (km/h)
  - Debounce Realtime (ms)
  - Itens por página e tentativas de reconexão
- O botão "Gerar Pontos" chama o endpoint e salva em `gf_route_plan`.
- O Modal assina Supabase Realtime na tabela `gf_route_plan` filtrando por `route_id` e dispara atualização com debounce.

## Observações Técnicas

- Service role: defina `SUPABASE_SERVICE_ROLE_KEY` para salvar no banco via API.
- RLS: a inserção pelo client pode falhar; preferir `dbSave=true` no endpoint.
- Cache: geocodificação tem cache em memória; configure `NEXT_PUBLIC_GEOCODING_PRIMARY/ FALLBACK`.

