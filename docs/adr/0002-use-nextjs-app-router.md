# ADR-0002: Usar Next.js App Router

**Status:** Aceito  
**Data:** 2024-12-XX  
**Decisores:** Equipe de Desenvolvimento GolfFox

## Contexto

O projeto precisa de uma estrutura de roteamento moderna e performática para o frontend web. Next.js oferece duas opções:
- Pages Router (tradicional)
- App Router (novo, React Server Components)

## Decisão

Usar **Next.js App Router** como estrutura de roteamento principal.

**Versão:** Next.js 16.1 com App Router

**Razões:**
1. React Server Components para melhor performance
2. Layouts aninhados para reutilização
3. Streaming e Suspense nativos
4. Melhor SEO com Server Components
5. Suporte a Partial Prerendering (PPR)
6. Futuro do Next.js (Pages Router em manutenção)

## Consequências

**Positivas:**
- Melhor performance (menos JavaScript no cliente)
- SEO melhorado (Server Components)
- Developer experience melhorada
- Alinhado com futuro do Next.js

**Negativas:**
- Curva de aprendizado inicial
- Algumas bibliotecas ainda não suportam Server Components
- Requer cuidados com "use client" directives

## Implementação

- Estrutura de pastas: `app/` ao invés de `pages/`
- Server Components por padrão
- Client Components apenas quando necessário (`"use client"`)
- API Routes em `app/api/`

## Referências

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
