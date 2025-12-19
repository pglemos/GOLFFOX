# ADR-0004: Implementar CQRS para Auditoria

**Status:** Aceito  
**Data:** 2025-01-XX  
**Decisores:** Equipe de Desenvolvimento GolfFox

## Contexto

O sistema precisa de auditoria completa de operações críticas (criação de usuários, alterações de dados, etc.). A implementação atual mistura lógica de leitura e escrita nas mesmas rotas API.

## Decisão

Implementar **CQRS (Command Query Responsibility Segregation)** para separar operações de escrita (Commands) e leitura (Queries), com **Event Sourcing** para auditoria.

**Estrutura:**
- **Commands:** Operações de escrita (Create, Update, Delete)
- **Queries:** Operações de leitura (Get, List)
- **Events:** Eventos de domínio gerados por Commands
- **Event Store:** Armazenamento de eventos para auditoria

## Consequências

**Positivas:**
- Separação clara de responsabilidades
- Auditoria automática via eventos
- Facilita escalabilidade (leitura/escrita independentes)
- Histórico completo de mudanças
- Facilita testes (Commands/Queries isolados)

**Negativas:**
- Complexidade inicial maior
- Requer migração gradual de rotas existentes
- Eventual consistency (se aplicado completamente)
- Mais código para manter

## Implementação

**Fase 1 (Atual):**
- Estrutura CQRS criada
- Event sourcing para auditoria
- Migração gradual de rotas críticas

**Fase 2 (Futuro):**
- Migrar todas as rotas críticas
- Implementar read models otimizados
- Event replay para reconstrução de estado

## Rotas Prioritárias para Migração

1. `POST /api/admin/companies` → `CreateCompanyCommand`
2. `POST /api/admin/vehicles` → `CreateVehicleCommand`
3. `POST /api/admin/drivers` → `CreateDriverCommand`

## Referências

- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
