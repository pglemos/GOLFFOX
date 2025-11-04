# Correções para net::ERR_ABORTED

Este relatório documenta a classificação, causa raiz e soluções implementadas para os erros observados em runtime.

## Erros e Classificação

- `net::ERR_ABORTED http://localhost:3001/admin/preferences?_rsc=1w2ik`
  - Tipo: lógica/roteamento (prefetch de rota inexistente)
  - Criticidade: alta (gera erro recorrente ao navegar/prefetch)

- `net::ERR_ABORTED https://<supabase>.co/rest/v1/gf_service_requests?...tipo=eq.socorro...`
  - Tipo: runtime/rede mascarado por interceptação global de `fetch`
  - Criticidade: alta (afeta leituras Supabase e diagnóstico)

- `net::ERR_ABORTED http://localhost:3000/_next/static/webpack/...hot-update.json`
  - Tipo: ambiente (porta divergente/servidor HMR)
  - Criticidade: baixa (não bloqueia produção; típico em dev quando porta difere)

- `net::ERR_ABORTED http://localhost:3000/operator/funcionarios?_rsc=...` e `.../api/operator/create-employee`
  - Tipo: ambiente/runtime (navegação para 3000 com servidor em 3001)
  - Criticidade: média (depende do ambiente; corrigível alinhando porta)

## Causas Raiz

- Interceptor global de `fetch` em `web-app/lib/supabase.ts` simulava respostas para erros do Supabase, mascarando falhas reais e contribuindo para abortos de requisições e diagnóstico confuso.
- Link da `Topbar` apontava para `/admin/preferences` sem página correspondente.
- Página `/operator/alertas` usava coluna incorreta (`type`) em vez de `alert_type` e ignorava o filtro via URL.
- Ambiente com dev server em `3001` mas navegação em `3000` provocando abortos (HMR e API internas).

## Soluções Implementadas

1. Remoção da interceptação global de `fetch` em `web-app/lib/supabase.ts`.
2. Criação da página `web-app/app/admin/preferences/page.tsx` para o link da Topbar.
3. Correção de `/operator/alertas`:
   - Uso de `alert_type` na busca e exibição.
   - Filtro via URL (`?filter=delay|stopped|deviation`) mapeado para `route_delayed|bus_stopped|route_deviation`.
   - Cores por severidade (inclui `critical`).
4. Alinhamento de ambiente e prefetch:
   - Servidor dev reiniciado na porta `3000` para coincidir com a origem do preview e HMR.
   - Desativado `prefetch` em links de navegação centrais (Topbar e Sidebar) para reduzir abortos `_rsc` típicos de pré-carregamento em desenvolvimento.
5. Testes unitários adicionados:
   - `web-app/lib/__tests__/supabase.spec.ts` — garante que `fetch` global não é modificado.
   - `web-app/lib/__tests__/alerts.spec.ts` — valida lógica de filtragem.

## Compatibilidade

- Alterações mantêm compatibilidade retroativa; não mudamos contratos públicos.
- Cliente Supabase continua com configuração padrão e sem side effects globais.

## Verificações

- Recomendado executar em uma única porta (3000 ou 3001) para evitar abortos HMR.
- Testes unitários executam em CI/Jest e cobrem casos-chave de regressão.
- Preview verificado em `http://localhost:3000` sem novos erros visuais; navegação dos menus sem logs de abortos indevidos.
