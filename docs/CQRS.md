# Documentação CQRS - GolfFox

## Visão Geral

O GolfFox implementa o padrão CQRS (Command Query Responsibility Segregation) para separar operações de leitura e escrita, facilitando escalabilidade e manutenção.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Routes                               │
│                  (GET, POST, PUT, DELETE)                       │
└─────────────────┬───────────────────────┬───────────────────────┘
                  │                       │
                  ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│       Commands          │   │        Queries          │
│   (CreateCompany,       │   │    (GetCompany,         │
│    UpdateVehicle, etc)  │   │     ListVehicles, etc)  │
└───────────┬─────────────┘   └───────────┬─────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Command Handlers      │   │    Query Handlers       │
│   (Execute + Publish    │   │    (Read + Cache)       │
│    Domain Events)       │   │                         │
└───────────┬─────────────┘   └───────────┬─────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Database (Supabase)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
lib/cqrs/
├── commands/                    # Definições de Commands
│   ├── create-company.command.ts
│   ├── update-vehicle.command.ts
│   └── ...
├── queries/                     # Definições de Queries
│   ├── get-company.query.ts
│   ├── list-vehicles.query.ts
│   └── ...
├── handlers/                    # Handlers
│   ├── command-handler.interface.ts
│   ├── query-handler.interface.ts
│   ├── create-company.handler.ts
│   ├── update-vehicle.handler.ts
│   ├── get-company.handler.ts
│   └── list-vehicles.handler.ts
├── bus/                         # CQRS Bus
│   ├── cqrs-bus.ts
│   └── register-handlers.ts
└── index.ts                     # Exports
```

## Uso

### 1. Definir um Command

```typescript
// commands/create-company.command.ts
export interface CreateCompanyCommandPayload {
  name: string
  email?: string | null
  phone?: string | null
}

export class CreateCompanyCommand {
  readonly type = 'CreateCompanyCommand'
  constructor(public readonly payload: CreateCompanyCommandPayload) {}
}
```

### 2. Criar um Handler

```typescript
// handlers/create-company.handler.ts
import { ICommandHandler } from './command-handler.interface'
import { CreateCompanyCommand } from '../commands/create-company.command'

export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand, any> {
  async handle(command: CreateCompanyCommand): Promise<any> {
    // Lógica de criação
    const company = await CompanyService.createCompany(command.payload)
    return company
  }
}
```

### 3. Registrar Handler

```typescript
// bus/register-handlers.ts
import { cqrsBus } from './cqrs-bus'
import { CreateCompanyHandler } from '../handlers/create-company.handler'

const createCompanyHandler = new CreateCompanyHandler()
cqrsBus.registerCommandHandler<CreateCompanyCommand, any>(
  'CreateCompanyCommand',
  createCompanyHandler
)
```

### 4. Usar em Rotas API

```typescript
// app/api/admin/empresas/route.ts
import { CreateCompanyCommand, cqrsBus } from '@/lib/cqrs'
import '@/lib/cqrs/bus/register-handlers'

const USE_CQRS = process.env.ENABLE_CQRS === 'true'

async function createCompanyHandler(request: NextRequest) {
  const body = await request.json()
  
  if (USE_CQRS) {
    const command = new CreateCompanyCommand(body)
    const company = await cqrsBus.executeCommand(command)
    return successResponse(company, 201)
  }
  
  // Fallback para service direto
  const company = await CompanyService.createCompany(body)
  return successResponse(company, 201)
}
```

## Queries

### Definir uma Query

```typescript
// queries/get-company.query.ts
export class GetCompanyQuery {
  readonly type = 'GetCompanyQuery'
  constructor(public readonly companyId: string) {}
}
```

### Query Handler

```typescript
// handlers/get-company.handler.ts
export class GetCompanyHandler implements IQueryHandler<GetCompanyQuery, GetCompanyResult> {
  async handle(query: GetCompanyQuery): Promise<GetCompanyResult> {
    const company = await CompanyService.getCompanyById(query.companyId)
    
    if (!company) {
      return { success: false, error: 'Empresa não encontrada' }
    }
    
    return { success: true, company }
  }
}
```

## Event Sourcing

Os handlers publicam eventos de domínio automaticamente:

```typescript
// Após criar uma empresa
await publishCreatedEvent('Company', company.id, company)

// Após atualizar um veículo
await publishUpdatedEvent('Vehicle', vehicleId, changes)
```

### Event Store

Eventos são salvos em `gf_event_store`:

```sql
SELECT * FROM gf_event_store 
WHERE aggregate_type = 'Company' 
ORDER BY occurred_at DESC;
```

### Audit Handler

Eventos são automaticamente registrados em `gf_audit_log` para auditoria.

## Migração Gradual

O sistema suporta migração gradual via flag de ambiente:

```bash
# .env
ENABLE_CQRS=true  # Ativar CQRS
ENABLE_CQRS=false # Usar services diretamente (padrão)
```

## Commands Disponíveis

| Command | Handler | Descrição |
|---------|---------|-----------|
| CreateCompanyCommand | CreateCompanyHandler | Criar empresa |
| UpdateVeiculoCommand | UpdateVehicleHandler | Atualizar veículo |

## Queries Disponíveis

| Query | Handler | Descrição |
|-------|---------|-----------|
| GetCompanyQuery | GetCompanyHandler | Obter empresa por ID |
| ListVeiculosQuery | ListVehiclesHandler | Listar veículos com filtros |

## Boas Práticas

1. **Commands devem ser imutáveis** - Use `readonly`
2. **Handlers devem ser stateless** - Sem estado interno
3. **Sempre publicar eventos** - Para auditoria e integração
4. **Use o Bus** - Não instancie handlers diretamente em rotas
5. **Migre gradualmente** - Use a flag ENABLE_CQRS

## Referências

- `lib/cqrs/` - Implementação CQRS
- `lib/events/` - Event Store e Publisher
- `lib/services/server/` - Services que podem ser usados pelos handlers
