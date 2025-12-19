# Tarefas Pendentes - GolfFox

**Última atualização:** 2025-01-XX

---

## 📋 Tarefas do Plano que Ainda Estão Pendentes

### 1. ⏳ Migração de Rotas para CQRS

**Status:** Estrutura pronta, migração gradual pendente  
**Prioridade:** Média  
**Esforço estimado:** 8-16 horas

**O que fazer:**
1. Criar handlers para commands/queries existentes
2. Migrar `POST /api/admin/companies` para `CreateCompanyCommand`
3. Migrar `POST /api/admin/vehicles` para `CreateVehicleCommand`
4. Migrar outras rotas gradualmente

**Estrutura já criada:**
- ✅ Commands: `CreateCompanyCommand`, `UpdateVehicleCommand`
- ✅ Queries: `GetCompanyQuery`, `ListVehiclesQuery`
- ✅ CQRS Bus: `lib/cqrs/bus/cqrs-bus.ts`
- ✅ Interfaces de handlers

**Próximo passo:** Criar primeiro handler e migrar uma rota como prova de conceito

---

### 2. ⏳ Monitoramento e Observabilidade Avançado

**Status:** Básico implementado, melhorias pendentes  
**Prioridade:** Baixa  
**Esforço estimado:** 4-8 horas

**Já existe:**
- ✅ `lib/monitoring.ts` - Serviço básico de métricas
- ✅ `/api/analytics/web-vitals` - Coleta de Web Vitals
- ✅ Logging estruturado
- ✅ Runbook de monitoramento

**Pode melhorar:**
- Integração com APM (Datadog, New Relic, Sentry)
- Dashboards de métricas em tempo real
- Alertas proativos baseados em thresholds
- Métricas de negócio (KPIs customizados)

**Próximo passo:** Escolher ferramenta de APM e integrar

---

### 3. ⏳ Funcionalidades Mobile Completas

**Status:** Estrutura básica existe, funcionalidades faltantes  
**Prioridade:** Média  
**Esforço estimado:** 16-32 horas

**Já existe:**
- ✅ Telas de Driver (checklist, route, scan, history, chat)
- ✅ Telas de Passenger (map, details, feedback, checkin, etc.)
- ✅ Autenticação integrada
- ✅ Integração com Supabase

**Faltando:**
- Testes unitários e E2E
- Publicação nas lojas (App Store, Google Play)
- Funcionalidades específicas (verificar com equipe)
- Otimizações de performance mobile

**Próximo passo:** Auditar funcionalidades faltantes e criar plano de implementação

---

### 4. ⏳ Suite Completa de Testes

**Status:** Testes básicos existem, cobertura insuficiente  
**Prioridade:** Alta  
**Esforço estimado:** 32-64 horas

**Já existe:**
- ✅ 133 arquivos de teste
- ✅ Testes unitários (APIs, libs, hooks)
- ✅ Testes E2E (Playwright)
- ✅ Testes de integração

**Faltando:**
- Testes de segurança (SQL injection, XSS, CSRF)
- Testes de performance (carga, stress)
- Testes de acessibilidade (WCAG 2.1)
- Testes mobile (React Native)
- Meta: 80% cobertura

**Próximo passo:** Criar plano de testes e começar pelos mais críticos

---

## 📊 Resumo

| Tarefa | Status | Prioridade | Esforço |
|--------|--------|------------|---------|
| Migração CQRS | Estrutura pronta | Média | 8-16h |
| Monitoramento | Básico existe | Baixa | 4-8h |
| Mobile | Estrutura básica | Média | 16-32h |
| Testes | Básicos existem | Alta | 32-64h |

**Total estimado:** 60-120 horas

---

## 🎯 Recomendações

1. **Priorizar Testes** - Maior impacto na qualidade
2. **Migração CQRS Gradual** - Fazer 1-2 rotas por sprint
3. **Mobile** - Validar funcionalidades faltantes com equipe
4. **Monitoramento** - Pode ser feito quando necessário

---

**Última atualização:** 2025-01-XX
