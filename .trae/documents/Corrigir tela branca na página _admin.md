## Diagnóstico Inicial

* A rota `\admin` usa Next.js App Router em `apps/web/app/admin/page.tsx`.

* O componente retorna `null` quando `!user` (linhas `apps/web/app/admin/page.tsx:218–220`), o que produz tela em branco.

* O middleware protege `\admin` por cookie `golffox-session` e role (linhas `apps/web/middleware.ts:44–89`), mas se `NEXT_PUBLIC_DISABLE_MIDDLEWARE` estiver ativo em produção, o guard é ignorado e o `page.tsx` não redireciona.

## Causas Prováveis

* `NEXT_PUBLIC_DISABLE_MIDDLEWARE` verdadeiro no ambiente de produção.

* Sessão inválida/ausente: `useAuthFast` não redireciona, apenas define estado (linhas `apps/web/hooks/use-auth-fast.tsx:17–83`).

* Ausência de `error.tsx`/`loading.tsx` dedicados em `app/admin` faz com que falhas ou estados vazios mostrem branco.

## Alterações Propostas

* Substituir o retorno `null` por redirecionamento explícito quando `!user`:

  * Em `apps/web/app/admin/page.tsx:218–220`, usar `router.replace('/?next=/admin')` para levar o usuário ao login/home com o parâmetro de retorno.

* Adicionar verificação de role defensiva no cliente (caso middleware esteja desativado): se `user.role !== 'admin'`, redirecionar para `'/unauthorized'`.

* Criar `apps/web/app/admin/error.tsx` para exibir uma UI de erro visível, evitando branco em exceções.

* Criar `apps/web/app/admin/loading.tsx` para skeleton nativo do App Router; mantém consistência com o loader já existente.

* (Opcional) Introduzir `app/admin/layout.tsx` com um guard leve baseado em `useAuthFast` para aplicar a checagem em todas as subrotas.

## Hardening de Middleware

* Garantir que o guard do Edge esteja ativo em produção:

  * Validar `NEXT_PUBLIC_DISABLE_MIDDLEWARE=false` no Vercel.

* Manter try/catch já existente para cookies inválidos (`apps/web/middleware.ts:57–88`).

## Validação

* Cenários:

  * Usuário sem sessão acessando `\admin` é redirecionado para `/` com `?next=/admin`.

  * Usuário com sessão e role diferente de `admin` vai para `'/unauthorized'`.

  * Usuário `admin` vê o dashboard sem branco; loader aparece enquanto `kpis`/`audit-log` carregam.

* Testes:

  * E2E: visitar `/admin` sem cookie e verificar redirecionamento; com cookie `role=operator` verificar `'/unauthorized'`.

  * Smoke manual após deploy em `https://golffox.vercel.app/admin`.

## Deploy e Rollout

* Conferir envs no Vercel (principalmente `NEXT_PUBLIC_DISABLE_MIDDLEWARE`).

* Deploy canário; monitorar erros via Sentry (já integrado em `app/global-error.tsx`).

* Se necessário, rollback rápido apenas do `page.tsx` mantendo middleware ativo.

## Resultado Esperado

* A página `\admin` nunca apresenta tela branca; em estados não autorizados ou sem sessão, o usuário é redirecionado ou vê uma página apropriada. KPI e atividades carregam com loader visível.

