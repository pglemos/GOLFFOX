# Credenciais de Teste - GolfFox

Este documento contém as credenciais de teste para acessar a aplicação GolfFox com diferentes tipos de usuário.

## 🚀 Como Usar

1. Acesse a aplicação em: `http://localhost:8080`
2. Use uma das credenciais abaixo para fazer login
3. Você será redirecionado automaticamente para o dashboard correspondente ao seu tipo de usuário

## 👥 Credenciais Disponíveis

### 🔧 Administrador
- **Email:** `golffox@admin.com`
- **Senha:** `senha123`
- **Tipo:** Admin
- **Dashboard:** Painel administrativo completo com gestão de usuários, transportadoras, métricas e relatórios

### 📊 Operador
- **Email:** `operador@empresa.com`
- **Senha:** `senha123`
- **Tipo:** Operator
- **Dashboard:** Painel de operações com gestão de viagens, monitoramento em tempo real e KPIs

### 🚛 Transportadora
- **Email:** `transportadora@trans.com`
- **Senha:** `senha123`
- **Tipo:** Carrier
- **Dashboard:** Painel de transportadora com gestão de frota, motoristas e viagens

### 🚗 Motorista
- **Email:** `motorista@trans.com`
- **Senha:** `senha123`
- **Tipo:** Driver
- **Dashboard:** Painel do motorista com viagens atribuídas, rastreamento e detalhes de rota

### 👤 Passageiro
- **Email:** `passageiro@empresa.com`
- **Senha:** `senha123`
- **Tipo:** Passenger
- **Dashboard:** Painel do passageiro com acompanhamento de viagem em tempo real e relatório de incidentes

## 🔄 Sistema de Redirecionamento

O sistema implementa redirecionamento automático baseado no tipo de usuário:

- **Admin** → `/admin`
- **operador** → `/operador`
- **transportadora** → `/transportadora`
- **motorista** → `/motorista`
- **passageiro** → `/passageiro`

## 🛡️ Segurança

- Todas as senhas são criptografadas no banco de dados
- Sistema de autenticação baseado em JWT via Supabase
- Controle de acesso por roles (RBAC)
- Logout seguro disponível em todos os dashboards

## 📱 Funcionalidades por Tipo de Usuário

### Admin
- Gestão completa de usuários
- Relatórios e métricas globais
- Configurações do sistema
- Gestão de transportadoras

### Operator
- Monitoramento de viagens em tempo real
- Gestão de rotas e horários
- KPIs operacionais
- Ações rápidas de operação

### Carrier
- Gestão de frota de veículos
- Controle de motoristas
- Viagens da transportadora
- Métricas de performance

### Driver
- Viagens atribuídas
- Rastreamento GPS em tempo real
- Detalhes de rota
- Status de viagem

### Passenger
- Acompanhamento de viagem em tempo real
- Localização do motorista
- Relatório de incidentes
- Informações da viagem

## 🔧 Desenvolvimento

Para executar a aplicação:

```bash
flutter run -d chrome --web-port 8080
```

A aplicação estará disponível em `http://localhost:8080`