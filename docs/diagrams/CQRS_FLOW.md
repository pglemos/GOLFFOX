# Diagrama de Fluxo CQRS - GolfFox

**Última atualização:** 2025-01-XX

---

## 📊 Visão Geral

Este documento descreve o fluxo CQRS (Command Query Responsibility Segregation) e Event Sourcing para auditoria no GolfFox.

---

## 🏗️ Arquitetura CQRS

```mermaid
graph TB
    subgraph "API Layer"
        API[API Routes]
    end
    
    subgraph "CQRS Layer"
        Commands[Commands]
        Queries[Queries]
        Bus[CQRS Bus]
    end
    
    subgraph "Domain Layer"
        Entities[Entities]
        Events[Domain Events]
    end
    
    subgraph "Event Sourcing"
        EventStore[Event Store]
        Publisher[Event Publisher]
    end
    
    subgraph "Handlers"
        CommandHandlers[Command Handlers]
        QueryHandlers[Query Handlers]
        AuditHandler[Audit Handler]
    end
    
    subgraph "Data Layer"
        Repositories[Repositories]
        DB[(PostgreSQL)]
    end
    
    API -->|Write| Commands
    API -->|Read| Queries
    
    Commands --> Bus
    Queries --> Bus
    
    Bus --> CommandHandlers
    Bus --> QueryHandlers
    
    CommandHandlers --> Entities
    Entities --> Events
    Events --> EventStore
    EventStore --> Publisher
    Publisher --> AuditHandler
    
    CommandHandlers --> Repositories
    QueryHandlers --> Repositories
    Repositories --> DB
    
    AuditHandler --> DB
```

---

## 📝 Fluxo de Command (Escrita)

```mermaid
sequenceDiagram
    participant API as API Route
    participant Command as CreateCompanyCommand
    participant Bus as CQRS Bus
    participant Handler as Command Handler
    participant Domain as Company Entity
    participant EventStore as Event Store
    participant Repo as Company Repository
    participant DB as PostgreSQL
    participant Audit as Audit Handler

    API->>Command: new CreateCompanyCommand(data)
    Command->>Bus: Execute(command)
    Bus->>Handler: Handle(command)
    
    Handler->>Domain: Company.create(data)
    Domain->>Domain: Validar regras de negócio
    Domain->>Domain: Gerar CompanyCreatedEvent
    Domain-->>Handler: Company + Event
    
    Handler->>Repo: save(company)
    Repo->>DB: INSERT INTO companies
    DB-->>Repo: Company criada
    Repo-->>Handler: Company
    
    Handler->>EventStore: save(CompanyCreatedEvent)
    EventStore->>DB: INSERT INTO event_store
    
    EventStore->>Audit: publish(CompanyCreatedEvent)
    Audit->>DB: INSERT INTO gf_audit_log
    
    Handler-->>API: Company criada
    API-->>Client: 201 Created
```

---

## 🔍 Fluxo de Query (Leitura)

```mermaid
sequenceDiagram
    participant API as API Route
    participant Query as GetCompanyQuery
    participant Bus as CQRS Bus
    participant Handler as Query Handler
    participant Cache as Redis Cache
    participant Repo as Company Repository
    participant DB as PostgreSQL

    API->>Query: new GetCompanyQuery(id)
    Query->>Bus: Execute(query)
    Bus->>Handler: Handle(query)
    
    Handler->>Cache: get(cacheKey)
    alt Cache Hit
        Cache-->>Handler: Dados em cache
        Handler-->>API: Company (cache)
    else Cache Miss
        Handler->>Repo: findById(id)
        Repo->>DB: SELECT * FROM companies
        DB-->>Repo: Company
        Repo-->>Handler: Company
        Handler->>Cache: set(cacheKey, company)
        Handler-->>API: Company
    end
    
    API-->>Client: 200 OK
```

---

## 📨 Fluxo de Event Sourcing

```mermaid
sequenceDiagram
    participant Command as Command
    participant Domain as Domain Entity
    participant EventStore as Event Store
    participant Publisher as Event Publisher
    participant AuditHandler as Audit Handler
    participant OtherHandlers as Other Handlers
    participant DB as PostgreSQL

    Command->>Domain: Execute operation
    Domain->>Domain: Generate events
    Domain-->>Command: Result + Events
    
    Command->>EventStore: save(events)
    EventStore->>DB: INSERT INTO event_store
    
    EventStore->>Publisher: publish(events)
    
    Publisher->>AuditHandler: handle(CompanyCreatedEvent)
    AuditHandler->>DB: INSERT INTO gf_audit_log
    
    Publisher->>OtherHandlers: handle(CompanyCreatedEvent)
    Note over OtherHandlers: Notificações,<br/>Webhooks, etc.
```

---

## 🗂️ Estrutura de Eventos

```mermaid
classDiagram
    class DomainEvent {
        <<interface>>
        +eventId: string
        +aggregateId: string
        +eventType: string
        +occurredAt: Date
        +data: object
    }
    
    class CompanyCreatedEvent {
        +companyId: string
        +name: string
        +createdBy: string
    }
    
    class CompanyUpdatedEvent {
        +companyId: string
        +changes: object
        +updatedBy: string
    }
    
    class VehicleCreatedEvent {
        +vehicleId: string
        +plate: string
        +companyId: string
    }
    
    DomainEvent <|-- CompanyCreatedEvent
    DomainEvent <|-- CompanyUpdatedEvent
    DomainEvent <|-- VehicleCreatedEvent
```

---

## 🔄 Replay de Eventos (Futuro)

```mermaid
graph TD
    A[Event Store] --> B[Selecionar Eventos]
    B --> C[Ordenar por occurredAt]
    C --> D[Aplicar Eventos]
    D --> E[Reconstruir Estado]
    E --> F[Read Model Atualizado]
```

---

## 📋 Exemplo: Criar Empresa

### 1. Command

```typescript
class CreateCompanyCommand {
  name: string
  email?: string
  phone?: string
}
```

### 2. Handler

```typescript
class CreateCompanyHandler {
  async handle(command: CreateCompanyCommand): Promise<Company> {
    // 1. Validar
    // 2. Criar entidade
    // 3. Salvar
    // 4. Publicar evento
  }
}
```

### 3. Event

```typescript
class CompanyCreatedEvent {
  companyId: string
  name: string
  createdAt: Date
}
```

### 4. Audit Handler

```typescript
class AuditHandler {
  async handle(event: CompanyCreatedEvent): Promise<void> {
    // Registrar em gf_audit_log
  }
}
```

---

**Última atualização:** 2025-01-XX
