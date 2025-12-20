# GolfFox Transport Management System - Architecture Plan

## Executive Summary
This document outlines the comprehensive architecture for GolfFox, a transport management system with multi-persona apps (motorista/passageiro Flutter apps) and admin dashboards (Next.js), backed by Supabase with real-time tracking, RLS security, and modern UX.

## System Overview
- **Flutter Apps**: motorista & passageiro mobile applications
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Architecture**: Multi-persona role-based access control
- **Real-time**: GPS tracking, trip status updates, chat/incidents

## Core Personas & Access Patterns
1. **Admin**: Global KPIs, system management, trip reopening with force
2. **operador**: Daily timeline, incident management, quick actions
3. **transportadora**: Fleet health, motorista/passageiro communication, route monitoring
4. **motorista**: Trip management, GPS tracking transmission, status transitions
5. **passageiro**: Trip tracking, real-time updates, incident reporting

## Data Models & Relationships

### Core Entities
```
companies (1) ←→ (N) users
companies (1) ←→ (N) carriers
carriers (1) ←→ (N) routes
carriers (1) ←→ (N) vehicles
routes (1) ←→ (N) trips
trips (1) ←→ (N) driver_positions
trips (1) ←→ (N) trip_events
trips (1) ←→ (1) trip_summary
trips (N) ←→ (N) trip_passengers
users (1) ←→ (N) passenger_reports
users (1) ←→ (N) chat_messages
```

### Security Model (RLS)
- **Minimum Privilege**: Users see only data within their scope
- **motorista**: Own positions and assigned trips
- **passageiro**: Trips they're enrolled in
- **operador/Admin**: Company-scoped data
- **transportadora**: transportadora-scoped data

## Technical Implementation Plan

### Phase 1: Foundation & Data Layer
1. **Data Models** (`lib/models/`)
   - User, Company, transportadora, veiculo, Route
   - Trip, DriverPosition, TripEvent, TripSummary
   - TripPassenger, PassengerReport, ChatMessage

2. **Service Layer** (`lib/services/`)
   - AuthService: Role-based authentication & routing
   - TripService: CRUD operations & status transitions
   - TrackingService: GPS collection & transmission
   - RealtimeService: Stream subscriptions & updates
   - LocalStorageService: Offline queue & sync

### Phase 2: Authentication & Routing
1. **AuthManager Interface**
   - Sign in/out flows
   - Role detection & storage
   - Company/transportadora context retrieval

2. **Route Guards**
   - Persona-based screen routing
   - Permission validation
   - Session management

### Phase 3: Core Features
1. **motorista Features**
   - Trip status management (scheduled → inProgress → completed)
   - Real-time GPS transmission (10s intervals)
   - Offline queue with backoff retry
   - RPC integration for status transitions

2. **passageiro Features**
   - Real-time trip tracking
   - motorista position visualization
   - Incident reporting
   - Chat functionality

3. **Admin/operador Features**
   - Trip monitoring dashboard
   - Incident management
   - Trip reopening with force override
   - Real-time fleet visualization

### Phase 4: Real-time & Communication
1. **GPS Tracking**
   - Background location permissions
   - 10-second transmission intervals
   - Haversine distance calculation
   - Trip summary generation (triggers)

2. **Real-time Subscriptions**
   - driver_positions stream for map updates
   - chat_messages for communication
   - trip_events for status changes
   - passenger_reports for incidents

### Phase 5: UX & Polish
1. **Design System**
   - Vibrant color palette (avoiding Material Design)
   - Generous spacing & sophisticated typography
   - Apple/Tesla/Nubank-inspired aesthetics
   - Micro-animations & smooth transitions

2. **Responsive Layouts**
   - Mobile-first Flutter design
   - Clean dashboards with KPI widgets
   - Interactive maps with real-time updates
   - Empty states & loading skeletons

## Security Considerations
- **RLS Policies**: Enforce data isolation by role/company/transportadora
- **API Security**: Validate all inputs, use prepared statements
- **Real-time Security**: Channel-level permissions for Supabase Realtime
- **Offline Security**: Encrypt sensitive data in local storage

## Performance Optimizations
- **Efficient Queries**: Proper indexing on trip_id, driver_id, company_id
- **Real-time Throttling**: Batch GPS updates to prevent spam
- **Offline Support**: Queue failed requests with exponential backoff
- **Memory Management**: Dispose streams and controllers properly

## Deployment & Monitoring
- **Environment Variables**: Secure key management via --dart-define
- **Error Tracking**: Sentry integration for crash reporting
- **Analytics**: Trip completion rates, GPS accuracy metrics
- **Logging**: Structured logs for debugging and monitoring

This architecture ensures scalability, security, and excellent user experience across all personas while maintaining code quality and maintainability.