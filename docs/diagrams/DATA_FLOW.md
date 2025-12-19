# Diagrama de Fluxo de Dados - GolfFox

**Última atualização:** 2025-01-XX

---

## 📊 Visão Geral

Este documento descreve o fluxo de dados no sistema GolfFox, desde a requisição do cliente até a resposta.

---

## 🔄 Fluxo de Requisição API

```mermaid
sequenceDiagram
    participant Client as Cliente (Browser)
    participant Proxy as proxy.ts (Edge)
    participant API as API Route
    participant Auth as api-auth.ts
    participant Cache as Redis Cache
    participant DB as Supabase (PostgreSQL)
    participant Audit as Audit Log

    Client->>Proxy: Requisição HTTP
    Proxy->>Proxy: Validar autenticação
    Proxy->>Proxy: Verificar roles
    Proxy->>API: Rotear para API
    
    API->>Auth: requireAuth()
    Auth->>Auth: validateAuth()
    Auth->>DB: Buscar usuário
    DB-->>Auth: Dados do usuário
    Auth-->>API: Usuário autenticado
    
    alt Cache disponível
        API->>Cache: get(cacheKey)
        Cache-->>API: Dados em cache
        API-->>Client: Resposta (cache)
    else Cache miss
        API->>DB: Query
        DB-->>API: Dados
        API->>Cache: set(cacheKey, data, TTL)
        API-->>Client: Resposta
    end
    
    alt Operação perigosa
        API->>Audit: Registrar auditoria
        Audit->>DB: Inserir log
    end
```

---

## 🔐 Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant Client as Cliente
    participant Login as /api/auth/login
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL
    participant Proxy as proxy.ts

    Client->>Login: POST /api/auth/login
    Login->>Login: Validar CSRF
    Login->>Login: Sanitizar inputs
    Login->>Supabase: signInWithPassword()
    Supabase-->>Login: Session + User
    Login->>DB: Buscar role/company_id
    DB-->>Login: Dados do usuário
    Login->>Login: Criar cookie golffox-session
    Login-->>Client: 200 OK + Cookie
    
    Client->>Proxy: Requisição protegida
    Proxy->>Proxy: Ler cookie
    Proxy->>DB: Validar sessão
    DB-->>Proxy: Usuário válido
    Proxy->>Proxy: Verificar role
    Proxy-->>Client: Permitir acesso
```

---

## 💾 Fluxo de Cache

```mermaid
graph TD
    A[Requisição API] --> B{Cache Redis?}
    B -->|Hit| C[Retornar do Cache]
    B -->|Miss| D[Query ao Banco]
    D --> E[Processar Dados]
    E --> F[Armazenar no Cache]
    F --> G[Retornar Dados]
    
    H[Cron Job] --> I[Atualizar MV]
    I --> J[Invalidar Cache]
    J --> K[Próxima Requisição usa dados novos]
```

---

## 📝 Fluxo de Auditoria (CQRS/Event Sourcing)

```mermaid
sequenceDiagram
    participant API as API Route
    participant Command as Command Handler
    participant Domain as Domain Layer
    participant EventStore as Event Store
    participant AuditHandler as Audit Handler
    participant DB as PostgreSQL

    API->>Command: Execute Command
    Command->>Domain: Processar operação
    Domain->>Domain: Gerar eventos
    Domain-->>Command: Resultado + Eventos
    
    Command->>EventStore: Persistir eventos
    EventStore->>DB: Inserir eventos
    
    EventStore->>AuditHandler: Publicar eventos
    AuditHandler->>DB: Inserir em gf_audit_log
    
    Command-->>API: Resposta
```

---

## 🗄️ Fluxo de Dados Multi-Tenant

```mermaid
graph TD
    A[Requisição] --> B[Autenticação]
    B --> C[Extrair company_id/transportadora_id]
    C --> D[Query com RLS]
    D --> E[PostgreSQL aplica RLS]
    E --> F[Retorna apenas dados do tenant]
    F --> G[Resposta ao cliente]
```

---

## 🔄 Fluxo de Sincronização Realtime

```mermaid
sequenceDiagram
    participant Mobile as App Mobile
    participant Supabase as Supabase Realtime
    participant DB as PostgreSQL
    participant Web as Web App

    Mobile->>DB: Atualizar localização
    DB->>Supabase: Trigger change
    Supabase->>Web: WebSocket update
    Web->>Web: Atualizar UI
    
    Mobile->>DB: Criar alerta
    DB->>Supabase: Trigger change
    Supabase->>Web: WebSocket update
    Web->>Web: Mostrar notificação
```

---

## 📊 Fluxo de KPIs

```mermaid
graph TD
    A[Cron Job: refresh-kpis] --> B[REFRESH MATERIALIZED VIEW]
    B --> C[Invalidar Cache Redis]
    C --> D[Próxima requisição]
    D --> E{Cache?}
    E -->|Miss| F[Query MV]
    E -->|Hit| G[Retornar Cache]
    F --> H[Armazenar no Cache]
    H --> I[Retornar Dados]
    G --> I
```

---

## 🔒 Fluxo de Rotas Perigosas

```mermaid
sequenceDiagram
    participant Client as Cliente
    participant RateLimit as Rate Limiter
    participant Audit as Audit Middleware
    participant SQLValidator as SQL Validator
    participant API as API Route
    participant DB as PostgreSQL

    Client->>RateLimit: Requisição
    RateLimit->>RateLimit: Verificar limite
    RateLimit->>Audit: Passar requisição
    
    Audit->>Audit: Extrair contexto usuário
    Audit->>DB: Criar log de auditoria
    DB-->>Audit: Log criado
    
    Audit->>API: Executar handler
    API->>SQLValidator: Validar SQL
    SQLValidator-->>API: SQL válido
    API->>DB: Executar SQL
    DB-->>API: Resultado
    
    API->>DB: Registrar resultado (auditoria)
    API-->>Client: Resposta
```

---

**Última atualização:** 2025-01-XX
