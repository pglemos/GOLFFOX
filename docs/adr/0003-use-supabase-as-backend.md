# ADR-0003: Usar Supabase como Backend

**Status:** Aceito  
**Data:** 2024-11-XX  
**Decisores:** Equipe de Desenvolvimento GolfFox

## Contexto

O projeto precisa de um backend robusto para:
- Autenticação de usuários
- Banco de dados PostgreSQL
- Storage de arquivos
- Realtime para rastreamento GPS
- Multi-tenant com isolamento de dados

## Decisão

Usar **Supabase** como backend principal.

**Componentes utilizados:**
- PostgreSQL (banco de dados)
- Supabase Auth (autenticação)
- Supabase Storage (arquivos)
- Supabase Realtime (WebSockets)
- Row Level Security (RLS) para multi-tenant

## Consequências

**Positivas:**
- Backend como serviço (BaaS) - menos infraestrutura
- PostgreSQL completo com extensões
- Autenticação pronta (JWT, OAuth)
- Realtime nativo
- RLS para segurança multi-tenant
- Migrations versionadas
- Dashboard administrativo

**Negativas:**
- Vendor lock-in (Supabase)
- Limites de plano gratuito
- Dependência de serviço externo
- Algumas limitações de customização

## Implementação

- Cliente Supabase: `@supabase/supabase-js`
- Service Role Key para operações admin
- RLS policies para isolamento multi-tenant
- Migrations em `supabase/migrations/`

## Alternativas Consideradas

- **Firebase:** Rejeitado - NoSQL não adequado para dados relacionais
- **Backend próprio:** Rejeitado - Muito trabalho de infraestrutura
- **Prisma + PostgreSQL:** Rejeitado - Falta Auth e Realtime prontos

## Referências

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
