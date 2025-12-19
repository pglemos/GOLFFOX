# ADR-0005: Usar Redis para Cache Distribuído

**Status:** Aceito  
**Data:** 2025-01-XX  
**Decisores:** Equipe de Desenvolvimento GolfFox

## Contexto

O sistema precisa de cache distribuído para:
- Compartilhar cache entre múltiplas instâncias (Vercel)
- Melhorar performance de queries pesadas (KPIs, relatórios)
- Rate limiting (já implementado com Upstash Redis)
- Reduzir carga no banco de dados

## Decisão

Usar **Upstash Redis** para cache distribuído.

**Razões:**
- Já configurado para rate limiting
- Serverless (sem gerenciamento de infra)
- Compatível com Vercel (edge functions)
- TTL automático
- Baixo custo

## Consequências

**Positivas:**
- Cache compartilhado entre instâncias
- Melhor performance (menos queries ao banco)
- Reduz custos de banco de dados
- Facilita invalidação de cache
- Já está configurado (reutilizar conexão)

**Negativas:**
- Custo adicional (Upstash)
- Eventual consistency (cache pode estar desatualizado)
- Requer estratégia de invalidação
- Mais complexidade no código

## Implementação

**Estratégia de Cache:**
- Queries pesadas: TTL 5-15 minutos
- KPIs: TTL 1 hora (atualizado via cron)
- Dados raramente alterados: TTL 24 horas

**Invalidação:**
- Por tags (ex: `company:${id}`)
- Por padrão (ex: `kpis:*`)
- Manual via API admin

## Alternativas Consideradas

- **Vercel KV:** Rejeitado - Mais caro, menos features
- **Cache em memória:** Rejeitado - Não compartilhado entre instâncias
- **Next.js Cache API:** Rejeitado - Limitado, não distribuído

## Referências

- [Upstash Redis](https://upstash.com/docs/redis)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
