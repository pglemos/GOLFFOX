## Objetivo

* Validar, em produção, os fluxos críticos do GolfFox: autenticação, proteção de rotas, APIs essenciais, segurança de headers e redirecionamentos.

## Escopo dos Testes

* Domínio: `https://golffox.vercel.app`.

* Páginas: home, login, `/admin`, `/operator`.

* APIs: `/api/auth/csrf`, `/api/auth/login`, `/api/health`, endpoints admin/operator (smoke), `/api/analytics/web-vitals`.

* Segurança: cookies, headers, CSP, CSRF, rate limit.

## Ambiente e Dados

* Usuário admin de teste: `golffox@admin.com` / `senha123` (já validado).

* Sem criação/alteração de dados sensíveis; evitar POST/PUT fora do login.

* Usar cabeçalhos de teste quando suportados: `x-test-mode: true` onde aplicável (ex.: crons/reports).

## Metodologia

* Automação de navegação (browser) para validar UI/UX e redirecionamentos.

* Requisições HTTP diretas para testes de APIs e headers.

* Captura de evidências (screenshots e logs) por caso de teste.

## Casos de Teste

1. Home e Disponibilidade

* Acessar `/` e validar renderização: título “GOLF FOX - Gestão de Frotas”, blocos “Gestão Inteligente de Frotas”, CTA “Entre em sua conta”.

* Evidências: screenshot da home, status 200.

1. CSRF

* `GET /api/auth/csrf` com `credentials: include`: status 200; corpo com `token`/`csrfToken` e cookie `golffox-csrf`.

* Evidências: resposta JSON parcial (sem expor token completo), headers.

1. Login – Credenciais Válidas

* Preencher email/senha; submeter; validar resposta 200 com `token`, `user.id`, `user.email` (ou fallback `session.user.email`).

* Cookie `golffox-session` (httpOnly, `SameSite=Lax`, `secure`), redirecionamento para `/admin`.

* Evidências: logs de resposta (campos booleanos), screenshot pós-login.

1. Login – Validações de Formulário

* Email inválido e senha vazia: mensagens “Email inválido” e “Informe a senha”.

* Evidências: screenshots de mensagens.

1. Proteção de Rotas

* Sem sessão, acessar `/admin` e `/operator`: esperar proteção (redirect para `/` com parâmetro `next=`).

* Com sessão admin: `/admin` 200; `/operator` protegido conforme role.

* Evidências: headers de redirect, sessão presente.

1. Segurança de Headers

* Verificar HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, CSP com `connect-src` incluindo Supabase.

* Evidências: captura de headers.

1. Cookie e Sessão

* Validar que `golffox-session` é httpOnly e `secure`; decodificar (apenas local) para confirmar payload com `id`, `email`, `role`.

* Evidências: flags dos cookies.

1. API Saúde

* `GET /api/health`: status 200 e corpo esperado (saúde OK).

* Evidências: resposta.

1. Analytics Web Vitals (Smoke)

* `POST /api/analytics/web-vitals` com payload mínimo; esperar 200.

* Evidências: status e resposta (se houver).

1. Endpoints Admin/Operator (Smoke de Segurança)

* `GET` de endpoints list (sem credenciais de service-role): esperar 401/403, confirmando proteção.

* Evidências: códigos e mensagens.

1. Logout

* Executar logout (se houver ação), ou expirar sessão e validar retorno à página de login ao acessar `/admin`.

* Evidências: comportamento pós-logout.

## Critérios de Aceite

* Todos os casos retornam os status e comportamentos esperados.

* Sem 404/500 em rotas públicas.

* Cookies e headers de segurança presentes e corretos.

## Evidências e Entregáveis

* Screenshots: home, login, pós-login (`/admin`), mensagens de erro, headers.

* Logs resumidos por caso (status, booleans `hasToken/hasUser`, redirecionamentos).

* Relatório consolidado com resultados, achados e recomendações.

## Cronograma

* Execução automatizada imediata após aprovação: \~30–45 minutos, incluindo coleta e consolidação.

## Riscos e Mitigações

* Rate limit em endpoints: espaciar requisições e usar `x-test-mode` quando suportado.

* Crons e relatórios: validar segurança (401/403) sem execução efetiva.

## Observações

* Nenhum redirect global será aplicado.

* Somente validações não destrutivas e login de teste; nenhuma alteração de dados de produção.

## Próximo Passo

* Com sua confirmação, executo a bateria de testes, coleto evidências e entrego o relatório completo com screenshots e logs.

