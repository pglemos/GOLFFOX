# 📋 PRD - Documento de Requisitos do Produto

## GolfFox - Sistema de Gestão de Transporte Urbano

**Versão:** 1.0  
**Data:** 12 de Dezembro de 2025  
**Status:** Em Desenvolvimento  
**Autor:** Pedro Guilherme - SynVolt

---

## 1. Visão Geral do Produto

### 1.1 Propósito

O **GolfFox** é uma plataforma SaaS completa de gestão de transporte urbano corporativo, desenvolvida para atender empresas que necessitam de soluções integradas para o transporte de funcionários. O sistema oferece rastreamento GPS em tempo real, gestão completa de frotas, controle de custos, e uma experiência premium para todos os stakeholders.

### 1.2 Problema a Ser Resolvido

Empresas que oferecem transporte para funcionários enfrentam diversos desafios:

- **Falta de visibilidade** em tempo real da localização dos veículos
- **Dificuldade de comunicação** entre empresa, transportadora, motoristas e passageiros
- **Gestão ineficiente** de rotas e horários
- **Controle de custos** impreciso e manual
- **Ausência de métricas** para tomada de decisão
- **Experiência fragmentada** entre diferentes sistemas

### 1.3 Solução Proposta

Uma plataforma unificada com:

- **Rastreamento GPS em tempo real** de toda a frota
- **Painéis especializados** para cada tipo de usuário
- **Aplicativos móveis** para motoristas e passageiros
- **Dashboard analítico** com KPIs e relatórios automatizados
- **Gestão financeira** integrada com controle de custos
- **Notificações inteligentes** e alertas

### 1.4 Proposta de Valor

| Stakeholder | Benefício Principal |
|-------------|---------------------|
| **Empresa Contratante** | Visibilidade total do serviço e controle de custos |
| **Transportadora** | Gestão eficiente da frota e motoristas |
| **Motorista** | Ferramentas que facilitam o dia a dia |
| **Passageiro** | Informações em tempo real e experiência premium |
| **Administrador** | Controle total da plataforma multi-tenant |

---

## 2. Personas e Usuários

### 2.1 Administrador (Admin)

**Perfil:** Gestor da plataforma GolfFox  
**Objetivo:** Gerenciar todas as empresas, transportadoras e usuários da plataforma  
**Necessidades:**
- Visão global de todos os dados
- Gestão de permissões e acessos
- Relatórios consolidados
- Configuração do sistema

### 2.2 Empresa Contratante (Empresa)

**Perfil:** RH ou Gestor de Facilities de empresa que contrata o serviço de transporte  
**Objetivo:** Acompanhar o serviço contratado e gerenciar funcionários  
**Necessidades:**
- Cadastrar e gerenciar funcionários
- Acompanhar viagens em tempo real
- Visualizar custos e SLAs
- Receber alertas de atrasos

### 2.3 Operador da Transportadora (Operador)

**Perfil:** Gestor ou Dispatcher da transportadora parceira  
**Objetivo:** Gerenciar frota, motoristas e operação diária  
**Necessidades:**
- Controle de veículos e manutenções
- Gestão de motoristas e documentos
- Acompanhamento de viagens
- Relatórios operacionais

### 2.4 Motorista

**Perfil:** Condutor dos veículos de transporte  
**Objetivo:** Realizar as viagens de forma eficiente  
**Necessidades:**
- Checklist pré-viagem
- Navegação GPS integrada
- Comunicação com central
- Registro de embarques (QR/NFC)

### 2.5 Passageiro

**Perfil:** Funcionário que utiliza o transporte  
**Objetivo:** Chegar ao destino com conforto e pontualidade  
**Necessidades:**
- Ver localização do ônibus em tempo real
- Receber notificações de chegada
- Avaliar o serviço
- Solicitar alterações de rota

---

## 3. Funcionalidades do Sistema

### 3.1 Painel Administrativo (`/admin`)

#### 3.1.1 Dashboard
- **KPIs em tempo real:**
  - Total de viagens do dia
  - Veículos ativos
  - Funcionários em trânsito
  - Alertas críticos
  - Rotas do dia
- **Filtros avançados:** empresa, data, turno
- **Log de atividades recentes**

#### 3.1.2 Mapa da Frota
- Visualização em tempo real (Google Maps)
- Playback histórico com controles de velocidade
- Export PNG/CSV
- Filtros: empresa, rota, veículo, status, turno
- Deep-links para compartilhamento
- Legenda interativa

#### 3.1.3 Gestão de Rotas
- CRUD completo de rotas
- Geração automática de pontos de parada
- Otimização de rotas via algoritmos
- Visualização no mapa
- Associação com empresas e veículos

#### 3.1.4 Gestão de Veículos
- Cadastro completo (placa, modelo, capacidade, etc.)
- **Documentos anexados:**
  - CRLV
  - Licença ANTT
  - Foto do veículo
  - Certificado INMETRO
  - Certificado CADASTUR
  - ART
  - Laudo Técnico de Manutenção
- Histórico de manutenções
- Checklist de veículos

#### 3.1.5 Gestão de Motoristas
- Cadastro completo
- **Documentos anexados:**
  - CNH
  - Comprovante de Residência
  - Exames Toxicológicos
- Sistema de ranking e gamificação
- Avaliações de passageiros
- Controle de salários e benefícios

#### 3.1.6 Gestão de Empresas
- CRUD de empresas clientes
- Configurações de branding
- Associação de operadores
- Listagem de funcionários
- Configurações de SLA

#### 3.1.7 Gestão de Transportadoras
- CRUD de transportadoras parceiras
- **Documentos anexados:**
  - Contrato de Prestação de Serviço
  - Cartão CNPJ
  - Contrato Social
  - Certificado ART
  - Certificado de Seguro
- Dados bancários (banco, agência, conta, PIX)
- Representante legal (nome, CPF, RG, CNH, email, telefone)
- Associação de veículos e motoristas
- Criação de logins de acesso

#### 3.1.8 Gestão de Permissões
- Controle de papéis (admin, empresa, operador, motorista, passageiro)
- Troca de roles de usuários
- Histórico de alterações

#### 3.1.9 Socorro e Emergências
- Despache de emergência
- Histórico de ocorrências
- Status de atendimento
- Comunicação com motoristas

#### 3.1.10 Sistema de Alertas
- Tipos: erro, aviso, informação
- Filtros e busca
- Histórico com paginação
- Notificações push

#### 3.1.11 Relatórios
- **Tipos de relatórios:**
  - Atrasos por período
  - Ocupação de veículos
  - Passageiros não embarcados
  - Eficiência de rotas
  - Ranking de motoristas
  - Performance geral
- **Formatos de exportação:** PDF, Excel, CSV
- Agendamento automático via cron
- Envio por email

#### 3.1.12 Gestão de Custos
- Cálculo por rota/empresa/veículo
- Conciliação de faturas
- Orçamentos e comparativos
- Categorias de custos personalizáveis
- Import/Export de dados

#### 3.1.13 Central de Ajuda
- FAQ dinâmico
- Suporte via WhatsApp
- Documentação técnica
- Status do sistema

#### 3.1.14 Sincronização
- Monitor de operações Supabase
- Reprocessamento de falhas
- Status em tempo real

### 3.2 Painel da Empresa (`/empresa`)

#### 3.2.1 Dashboard
- Total de viagens
- Viagens em andamento/concluídas
- Atrasos acima de 5 minutos
- Ocupação média
- Custo diário
- SLA D0
- Lista de viagens com filtros

#### 3.2.2 Gestão de Funcionários
- Lista com busca e filtros
- Cadastro com geocodificação automática
- Status de transporte

#### 3.2.3 Visualização de Rotas
- Rotas atribuídas
- Status das rotas
- Mapa interativo

#### 3.2.4 Alertas
- Filtros por tipo
- Notificações específicas da empresa

#### 3.2.5 Comunicações
- Mensagens para funcionários
- Avisos gerais

#### 3.2.6 Conformidade
- Documentos regulatórios
- Certificações

#### 3.2.7 Custos
- Visão de custos da empresa
- Comparativo mensal

#### 3.2.8 Relatórios
- Relatórios específicos
- Export de dados

#### 3.2.9 Solicitações
- Pedidos de funcionários
- Workflow de aprovação

#### 3.2.10 Gestão de Prestadores
- Transportadoras associadas

### 3.3 Painel da Transportadora (`/transportadora`)

#### 3.3.1 Dashboard
- Total da frota
- Veículos em rota
- Motoristas ativos
- Veículos atrasados
- Visualização do mapa
- Lista de motoristas ativos
- Status da frota

#### 3.3.2 Mapa da Frota
- Todos os veículos em tempo real
- Integração com rotas
- Zoom e navegação

#### 3.3.3 Gestão de Veículos
- Lista detalhada da frota
- Informações completas
- Upload de documentos
- Registro de manutenções

#### 3.3.4 Gestão de Motoristas
- Lista de motoristas
- Documentação
- Exames
- Contato
- Ranking

#### 3.3.5 Alertas
- Notificações da transportadora
- Filtros e busca

#### 3.3.6 Relatórios
- Frota em uso
- Performance de motoristas
- Viagens realizadas
- Export (CSV/Excel/PDF)

#### 3.3.7 Custos
- Custos por rota
- Custos por veículo
- Relatórios financeiros

### 3.4 Aplicativo Móvel - Motorista

#### 3.4.1 Login e Autenticação
- Login com email/senha
- Sessão persistente

#### 3.4.2 Dashboard
- Viagens do dia
- Status atual

#### 3.4.3 Checklist Pré-Rota
- Verificação de itens obrigatórios
- Registro fotográfico
- Confirmação de partida

#### 3.4.4 Navegação GPS
- Mapa com rastreamento
- Rotas otimizadas
- Pontos de parada

#### 3.4.5 Scanner QR/NFC
- Validação de embarque
- Registro de passageiros

#### 3.4.6 Histórico
- Viagens realizadas
- Estatísticas pessoais

#### 3.4.7 Comunicação
- Chat com central
- Botão de emergência

### 3.5 Aplicativo Móvel - Passageiro

#### 3.5.1 Login e Autenticação
- Login com email/senha
- Código de empresa

#### 3.5.2 Dashboard
- Próxima viagem
- Informações do veículo/motorista

#### 3.5.3 Mapa em Tempo Real
- Localização do ônibus
- ETA (tempo estimado de chegada)
- Pontos de parada

#### 3.5.4 Detalhes de Rota
- Horários
- Paradas
- Estimativas

#### 3.5.5 Notificações
- Ônibus chegando
- Atrasos
- Alterações de rota

#### 3.5.6 Avaliação
- Avaliar viagem
- Feedback sobre motorista
- Comentários

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance

| Métrica | Alvo |
|---------|------|
| Tempo de carregamento inicial | < 3 segundos |
| Atualização de mapa em tempo real | < 1 segundo |
| Resposta de API | < 500ms (p95) |
| Disponibilidade | 99.9% uptime |

### 4.2 Segurança

- **Autenticação:** JWT com cookies HttpOnly
- **Autorização:** RBAC (Role-Based Access Control)
- **Isolamento:** RLS (Row Level Security) no Supabase
- **Proteção:** CSRF tokens, rate limiting (Upstash Redis)
- **Dados:** Criptografia em trânsito (TLS) e em repouso
- **Auditoria:** Log de todas as operações sensíveis

### 4.3 Escalabilidade

- Arquitetura serverless com Vercel Edge Functions
- Banco de dados PostgreSQL gerenciado (Supabase)
- CDN para assets estáticos
- Cache em múltiplas camadas (TanStack Query + HTTP)

### 4.4 Usabilidade

- Design responsivo (mobile-first)
- Acessibilidade WCAG 2.1 AA
- Suporte a múltiplos idiomas (Português BR)
- Tema claro com opção de tema escuro

### 4.5 Manutenibilidade

- Código TypeScript tipado
- Clean Architecture + DDD
- Testes unitários e E2E
- Documentação inline e técnica

---

## 5. Arquitetura Técnica

### 5.1 Stack Tecnológica

#### Frontend Web
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 16.0.7 | Framework React |
| React | 19.x | UI Library |
| TypeScript | 5.9.x | Tipagem |
| Tailwind CSS | 4.1.17 | Estilização |
| Radix UI | Latest | Componentes acessíveis |
| Zustand | 5.0.2 | Estado global |
| TanStack Query | 5.90.x | Data fetching |

#### Frontend Mobile
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React Native | 0.81.5 | Framework mobile |
| Expo | 54.0.27 | Build tool e runtime |
| Expo Router | 6.0.17 | Navegação |
| React Native Paper | 5.14.5 | Componentes UI |
| react-native-maps | 1.26.20 | Mapas |

#### Backend
| Tecnologia | Propósito |
|------------|-----------|
| Supabase | BaaS (Auth, Storage, Realtime) |
| PostgreSQL | Banco de dados |
| Upstash Redis | Rate limiting |
| Vercel | Hosting + Edge Functions |

### 5.2 Estrutura de Dados

#### Tabelas Principais
- `users` - Usuários (admin, empresa, operador, motorista, passageiro)
- `companies` - Empresas contratantes
- `carriers` - Transportadoras
- `vehicles` - Veículos da frota
- `drivers` - Motoristas (view de users com role='motorista')
- `routes` - Rotas de transporte
- `trips` - Viagens realizadas
- `gf_employee_company` - Funcionários das empresas
- `gf_user_company_map` - Multi-tenant users-empresas
- `gf_carrier_driver_map` - Motoristas-transportadoras
- `gf_carrier_vehicle_map` - Veículos-transportadoras
- `gf_costs` - Custos operacionais
- `gf_cost_categories` - Categorias de custos
- `gf_cost_budgets` - Orçamentos
- `gf_notifications` - Notificações
- `gf_report_schedules` - Agendamentos de relatórios
- `audit_logs` - Log de auditoria
- `driver_positions` - Posições GPS
- `trip_passengers` - Passageiros por viagem
- `vehicle_documents` - Documentos de veículos
- `driver_documents` - Documentos de motoristas

### 5.3 Integrações Externas

| Serviço | Propósito |
|---------|-----------|
| Google Maps API | Mapas e geocodificação |
| Supabase Auth | Autenticação |
| Supabase Storage | Armazenamento de arquivos |
| Supabase Realtime | WebSockets para tempo real |
| Vercel Analytics | Métricas de performance |
| SendGrid / Resend | Envio de emails |

---

## 6. Fluxos de Usuário

### 6.1 Fluxo de Login

![Fluxo de Login - Sistema de autenticação com redirecionamento baseado em role](./diagrams/login_flow.png)

**Descrição do fluxo:**
1. Usuário acessa o sistema
2. Verifica se está autenticado
3. Se não: exibe tela de login → envia credenciais
4. Valida credenciais no Supabase Auth
5. Busca role do usuário no banco de dados (tabela `users`)
6. Redireciona automaticamente baseado no role:
   - `admin` → `/admin`
   - `empresa` → `/empresa`
   - `operador` → `/transportadora`
   - `motorista` / `passageiro` → Abre app mobile

### 6.2 Fluxo de Viagem

![Fluxo de Viagem - Ciclo completo da viagem desde criação da rota até atualização de KPIs](./diagrams/trip_flow.png)

**Descrição do fluxo:**
1. **Criação da rota** → Viagem é agendada no sistema
2. **Checklist pré-viagem** → Motorista verifica itens obrigatórios
3. **Início da viagem** → GPS começa a transmitir posição em tempo real
4. **Embarque** → Passageiros acompanham pelo app e embarcam via QR/NFC
5. **Registro de presença** → Sistema registra cada embarque
6. **Loop de paradas** → Repete até todos os passageiros embarcarem
7. **Finalização** → Viagem encerrada, log registrado, KPIs atualizados

---

## 7. Roadmap

### Fase 1 - MVP (✅ Concluído)
- [x] Painel Admin completo
- [x] Painel Empresa básico
- [x] Painel Transportadora básico
- [x] Sistema de autenticação
- [x] Mapa em tempo real
- [x] Gestão de rotas
- [x] Gestão de veículos
- [x] Gestão de motoristas

### Fase 2 - Expansão (🔄 Em Andamento)
- [x] Sistema de documentos anexados
- [x] Dados bancários de transportadoras
- [x] Representante legal
- [ ] App móvel do motorista
- [ ] App móvel do passageiro
- [ ] Sistema de checklist
- [ ] Validação QR/NFC

### Fase 3 - Analytics
- [ ] Dashboard analítico avançado
- [ ] Machine Learning para otimização de rotas
- [ ] Previsão de demanda
- [ ] Relatórios customizáveis

### Fase 4 - Enterprise
- [ ] SSO/SAML
- [ ] API pública
- [ ] White-label
- [ ] Integrações com ERP

---

## 8. Métricas de Sucesso

| KPI | Meta | Medição |
|-----|------|---------|
| Uptime | 99.9% | Mensal |
| Tempo médio de resposta | < 500ms | Diário |
| NPS dos usuários | > 70 | Trimestral |
| Taxa de adoção | > 80% | Mensal |
| Redução de custos operacionais | 20% | Anual |
| Satisfação do passageiro | > 4.5/5 | Mensal |

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Falha no GPS | Média | Alto | Fallback com última posição conhecida |
| Indisponibilidade Supabase | Baixa | Crítico | Cache local + fallback mode |
| Vazamento de dados | Baixa | Crítico | RLS + criptografia + auditoria |
| Baixa adoção | Média | Alto | Treinamento + UX simplificado |
| Problemas de conectividade | Alta | Médio | Modo offline nos apps mobile |

---

## 10. Glossário

| Termo | Definição |
|-------|-----------|
| **Carrier** | Transportadora parceira responsável pelos veículos |
| **Empresa** | Empresa que contrata o serviço de transporte |
| **Operador** | Usuário que gerencia a transportadora |
| **RLS** | Row Level Security - segurança a nível de linha no banco |
| **Multi-tenant** | Arquitetura que suporta múltiplos clientes isolados |
| **KPI** | Key Performance Indicator - indicador de desempenho |
| **SLA** | Service Level Agreement - acordo de nível de serviço |

---

## 11. Anexos

### 11.1 Documentação Relacionada
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura técnica detalhada
- [PAINEIS.md](./PAINEIS.md) - Especificação dos painéis web
- [TRANSPORTADORAS_PANEL.md](./TRANSPORTADORAS_PANEL.md) - Documentação do painel de transportadoras
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guia de contribuição
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Guia de solução de problemas

### 11.2 URLs do Sistema
- **Login:** https://golffox.vercel.app
- **Admin:** https://golffox.vercel.app/admin
- **Empresa:** https://golffox.vercel.app/empresa
- **Transportadora:** https://golffox.vercel.app/transportadora

### 11.3 Credenciais de Teste
- **Admin:** golffox@admin.com / senha123
- **Empresa:** teste@empresa.com / senha123
- **Transportadora:** teste@transportadora.com / senha123
- **Motorista:** teste@motorista.com / senha123
- **Passageiro:** teste@passageiro.com / senha123
---

**Documento atualizado em:** 12 de Dezembro de 2025  
**Próxima revisão:** Janeiro de 2026
