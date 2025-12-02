# 📊 ANÁLISE DETALHADA: Escopo Técnico vs Sistema Implementado

**Data:** 16/11/2025  
**Projeto:** Golf Fox - Sistema de Gestão de Fretamento Corporativo  
**Status:** Análise Completa do que Falta Implementar

---

## 🎯 VISÃO GERAL

O documento de escopo define **Golf Fox** como uma plataforma SaaS completa de gestão de fretamento corporativo porta-a-porta. Abaixo está a análise detalhada de cada módulo.

---

## ✅ O QUE JÁ ESTÁ IMPLEMENTADO

### 1. 🏢 GESTÃO DE EMPRESAS
**Status: 70% Implementado**

✅ **Implementado:**
- Tabela `companies` no banco de dados
- CRUD completo de empresas (`/api/admin/companies`)
- Campos: id, name, cnpj, address, phone, email, is_active
- Interface admin (`/admin/empresas`)
- RLS (Row Level Security) configurado

❌ **Faltando:**
- Branding personalizado por empresa (logo, cores)
- Documentos anexos (contratos, certificados)
- Histórico de alterações
- Dashboard de visão consolidada por empresa

---

### 2. 👥 GESTÃO DE USUÁRIOS E PERFIS
**Status: 85% Implementado**

✅ **Implementado:**
- Sistema de autenticação (Supabase Auth)
- Tabela `users` com roles: admin, operator, carrier, driver, passenger
- Login com CSRF protection
- Middleware de proteção de rotas
- Gerenciamento de permissões
- Interface de usuários (`/api/admin/users`)

❌ **Faltando:**
- Interface para operadores criarem usuários colaboradores
- Gestão de permissões granulares (beyond roles)
- Perfil completo do usuário (foto, preferências)
- Logs de acesso e atividades por usuário

---

### 3. 🚗 GESTÃO DE FROTA (VEÍCULOS)
**Status: 60% Implementado**

✅ **Implementado:**
- Tabela `vehicles` no banco de dados
- CRUD de veículos (`/api/admin/vehicles`)
- Campos: plate, model, year, carrier_id, capacity, status
- Interface admin (`/admin/veiculos`)
- Associação com transportadoras

❌ **Faltando:**
- **Documentação de veículos:**
  - CRLV (Certificado de Registro)
  - IPVA (controle de vencimentos)
  - Seguro (apólice, vencimento)
  - Inspeção veicular (datas, certificados)
  
- **Manutenções:**
  - Tabela `vehicle_maintenances` (não existe)
  - Manutenções programadas vs realizadas
  - Controle de custos por manutenção
  - Alertas de manutenção preventiva
  - Histórico completo de manutenções
  
- **Custos Operacionais:**
  - Registro de combustível por veículo
  - Custos de manutenção detalhados
  - Depreciação
  - Relatórios financeiros por veículo
  
- **Status em Tempo Real:**
  - Veículo em garagem vs em rota
  - Última localização conhecida
  - Status do motorista vinculado
  - Alertas de problemas mecânicos

---

### 4. 🏢 PAINEL DA TRANSPORTADORA (CARRIER)
**Status: 25% Implementado**

✅ **Implementado:**
- Dashboard básico (`/carrier`)
- Visualização de veículos (`/carrier/veiculos`)
- Visualização de motoristas (`/carrier/motoristas`)
- Mapa da frota (`/carrier/mapa`)
- Relatórios básicos (`/carrier/relatorios`)
- KPIs básicos: Total da Frota, Em Rota, Motoristas Ativos, Atrasados
- Listagem de veículos com busca
- Listagem de motoristas com busca
- Mapa com integração ao FleetMap
- Sistema de exportação (CSV, Excel, PDF)

❌ **FALTANDO - CRÍTICO:**

#### 4.1 📋 GESTÃO DE MOTORISTAS (CADASTRO COMPLETO)
**Status: 10% Implementado**

**O que falta:**
- **Cadastro Completo:**
  - Tabela `driver_documents` (não existe)
  - CNH (upload, validade, categoria)
  - CPF
  - RG
  - Comprovante de residência
  - Foto 3x4
  - Certidões (criminal, cível)
  
- **Exames Médicos:**
  - Tabela `driver_medical_exams` (não existe)
  - Exame admissional
  - Exames periódicos
  - Exames toxicológicos (Lei 13.103/2015)
  - Controle de vencimentos
  - Alertas de exames vencidos/próximos do vencimento
  - Upload de laudos médicos
  
- **Documentação:**
  - Upload de documentos digitalizados
  - Controle de validades automático
  - Notificações de vencimento (30/15/7 dias antes)
  - Histórico de renovações
  - Status de conformidade (apto/inapto/pendente)
  
- **Interface:**
  - Formulário completo de cadastro
  - Área de upload de documentos
  - Dashboard de vencimentos por motorista
  - Filtros: aptos, inaptos, documentos vencidos
  - Relatório de conformidade

#### 4.2 🚗 GESTÃO DE FROTA (DOCUMENTOS E MANUTENÇÕES)
**Status: 35% Implementado**

**O que falta:**
- **Documentação de Veículos:**
  - Tabela `vehicle_documents` (não existe)
  - CRLV (Certificado de Registro e Licenciamento)
  - IPVA (controle de pagamento e vencimento)
  - Seguro (apólice, valor, vencimento, cobertura)
  - Inspeção veicular (data, certificado)
  - Alvará de funcionamento
  - Controle de vencimentos com alertas
  
- **Manutenções:**
  - Tabela `vehicle_maintenances` (não existe)
  - Manutenções preventivas (agendadas por km ou data)
  - Manutenções corretivas (quando quebra)
  - Histórico completo de manutenções
  - Custos por manutenção (peças, mão de obra)
  - Status: agendada, em andamento, concluída
  - Próxima manutenção prevista
  - Notificações de manutenção pendente

#### 4.3 🗺️ MAPA EM TEMPO REAL (VISÃO COMPLETA)
**Status: 45% Implementado**

**O que está implementado:**
- Mapa básico com veículos
- Status: em rota, disponível, atrasado
- Integração com `driver_positions`
- Visualização de posição atual

**O que falta:**
- **Pontos de Embarque/Desembarque POR VEÍCULO:**
  - Marcadores no mapa para cada ponto de embarque
  - Marcadores no mapa para cada ponto de desembarque
  - Cores diferentes: pendente (vermelho), realizado (verde)
  - À medida que os embarques são realizados, os pontos desaparecem do mapa
  - Ordem de passagem pelos pontos
  - ETA (tempo estimado de chegada) em cada ponto
  
- **Pontos de Embarque/Desembarque POR ROTA:**
  - Visualização da rota completa
  - Todos os pontos da rota no mapa
  - Linha conectando os pontos (polyline)
  - Atualização em tempo real conforme motorista avança
  
- **Quantidade de Passageiros em Tempo Real:**
  - Badge no veículo mostrando "3/15" (3 embarcados de 15 total)
  - Atualização em tempo real conforme check-ins são feitos
  - Visualização de passageiros pendentes por ponto
  - Painel lateral com detalhes da rota atual
  
- **Filtros e Visualizações:**
  - Filtrar veículos: todos, em rota, em garagem
  - Filtrar rotas: manhã, tarde, noite
  - Visualizar rotas sobrepostas
  - Clustering de veículos próximos
  
- **Dados em Tempo Real:**
  - WebSocket ou polling a cada 10-30 segundos
  - Atualização automática de posições
  - Atualização automática de passageiros embarcados
  - Notificações de eventos (atraso, incidente)

#### 4.4 💰 CONTROLE DE CUSTOS (POR VEÍCULO E ROTA)
**Status: 15% Implementado**

**O que está implementado:**
- Tabela `costs` básica
- API `/api/admin/costs` (CRUD simples)

**O que falta:**
- **Custos por Veículo:**
  - Tabela `vehicle_costs` detalhada (não existe propriamente)
  - Combustível (data, litros, valor, km rodado)
  - Manutenções (preventiva, corretiva)
  - Seguro (valor mensal/anual)
  - IPVA (valor anual)
  - Depreciação
  - Pneus e peças
  - Lavagem e limpeza
  - Pedágios
  - Multas
  - Custo total por mês
  - Custo por km rodado
  - Interface de cadastro de custos
  - Dashboard de custos por veículo
  - Gráficos de evolução de custos
  
- **Custos por Rota:**
  - Tabela `route_costs` (não existe)
  - Custo de combustível por rota (baseado em km)
  - Custo de mão de obra (motorista)
  - Custo de manutenção proporcional
  - Custo fixo (seguro, IPVA proporcional)
  - Pedágios específicos da rota
  - Custo total por rota
  - Custo por passageiro transportado
  - Rentabilidade da rota
  - Dashboard de custos por rota
  - Comparação entre rotas
  - Rotas mais/menos rentáveis

---

### 5. 👨‍✈️ GESTÃO DE MOTORISTAS (ADMIN)
**Status: 40% Implementado**

✅ **Implementado:**
- Tabela `drivers` no banco de dados
- Usuários com role 'driver'
- Associação básica com transportadora
- Interface admin (`/admin/motoristas`)

❌ **Faltando (CRÍTICO):**
- **Documentação Obrigatória:**
  - CNH (número, categoria, validade)
  - Upload de foto/scan da CNH
  - CPF, RG
  - Comprovante de endereço
  
- **Exames Médicos:**
  - Tabela `driver_health_exams` (não existe)
  - Exame admissional
  - Exame periódico
  - Exame toxicológico
  - Controle de vencimentos
  - Alertas automáticos de vencimento
  
- **Histórico e Performance:**
  - Total de viagens realizadas
  - Avaliação média
  - Incidentes relacionados
  - Pontualidade média
  - Horas trabalhadas
  
- **Status e Disponibilidade:**
  - Motorista disponível/ocupado/folga
  - Escala de trabalho
  - Histórico de jornada
  
- **Treinamentos:**
  - Treinamentos realizados
  - Certificados
  - Vencimentos

---

### 5. 🗺️ PLANEJAMENTO DE ROTAS
**Status: 55% Implementado**

✅ **Implementado:**
- Tabela `routes` no banco de dados
- CRUD de rotas (`/api/admin/routes`)
- Campos básicos: name, company_id, carrier_id, origin, destination
- Tabela `route_stops` (pontos de parada)
- Interface de criação (`/admin/rotas`)
- Geração automática de pontos (`/api/admin/generate-stops`)
- Otimização de rotas (`/api/admin/optimize-route`)

❌ **Faltando (IMPORTANTE):**
- **Turnos e Horários:**
  - Tabela `route_schedules` (não existe)
  - Definição de horários por turno (manhã, tarde, noite)
  - Dias da semana ativos
  - Horário de cada ponto de embarque/desembarque
  
- **Pontos de Parada Detalhados:**
  - Endereço completo de cada ponto
  - Referência (ex: "Em frente ao mercado X")
  - Tempo estimado de espera
  - Ordem de parada
  - Quantidade de passageiros por ponto
  
- **Gestão de Capacidade:**
  - Capacidade do veículo vs passageiros na rota
  - Otimização para não exceder capacidade
  
- **Rotas de Ida e Volta:**
  - Rota de ida (residência → empresa)
  - Rota de retorno (empresa → residência)
  - Definição de pontos diferentes para cada direção
  
- **Validações:**
  - Verificar se veículo está disponível
  - Verificar se motorista está disponível
  - Validar capacidade vs passageiros
  - Detectar conflitos de horário

---

### 6. 🎫 CHECK-IN / CHECK-OUT DE PASSAGEIROS
**Status: 20% Implementado**

✅ **Implementado:**
- Tabela `trip_passengers` (relacionamento)
- Status básico: pending, confirmed, pickedup, dropped
- Campos de pickup_location e dropoff_location

❌ **Faltando (CRÍTICO - CORE DO SISTEMA):**
- **Sistema de Check-in:**
  - Tabela `passenger_checkins` (não existe)
  - Timestamp de embarque
  - Localização GPS do embarque
  - Método: NFC, QR Code, Manual
  
- **Sistema de Check-out:**
  - Timestamp de desembarque
  - Localização GPS do desembarque
  - Confirmação pelo motorista
  
- **NFC:**
  - Integração com leitores NFC
  - Cadastro de cartões NFC por passageiro
  - Validação de cartão
  - App do motorista com leitura NFC
  
- **QR Code:**
  - Geração de QR Code por passageiro
  - Geração de QR Code por viagem
  - App do motorista com leitor de QR Code
  - Validação e registro
  
- **Registro Manual:**
  - Lista de passageiros no app do motorista
  - Marcar presença manualmente
  - Confirmar embarque/desembarque
  
- **Histórico:**
  - Histórico completo de check-ins por passageiro
  - Histórico por viagem
  - Estatísticas de presença
  - Ausências registradas

---

### 7. 📍 RASTREAMENTO GPS EM TEMPO REAL
**Status: 45% Implementado**

✅ **Implementado:**
- Tabela `driver_positions` (rastreamento GPS)
- Campos: latitude, longitude, accuracy, speed, heading, timestamp
- Realtime habilitado (Supabase Realtime)
- Interface de mapa (`/admin/mapa`)
- API de posições

❌ **Faltando (IMPORTANTE):**
- **Rastreamento Contínuo:**
  - App do motorista enviando posição a cada X segundos
  - Intervalo configurável
  - Otimização de bateria
  
- **Mapa em Tempo Real - Golf Fox:**
  - Visualização TODOS os veículos simultaneamente
  - Filtro por empresa
  - Filtro por transportadora
  - Filtro por status (em rota, parado, etc)
  - Atualização automática sem refresh
  
- **Mapa em Tempo Real - Empresa:**
  - Visualização apenas dos veículos da empresa
  - Rotas da empresa
  - Passageiros da empresa
  
- **Mapa em Tempo Real - Transportadora:**
  - Todos os veículos da transportadora
  - Status: em rota vs em garagem
  - Veículos ociosos
  
- **Informações no Mapa:**
  - Ícone diferente por status
  - Tooltip com informações do veículo
  - Rota atual
  - Motorista
  - Passageiros embarcados
  - Próxima parada
  - ETA (tempo estimado de chegada)
  
- **Pontos de Embarque/Desembarque:**
  - Marcadores no mapa
  - Pontos pendentes vs concluídos
  - Tempo real de progresso da rota
  - Contagem de passageiros por ponto
  
- **Alertas Geográficos:**
  - Alerta quando veículo se desvia da rota
  - Alerta quando veículo para em local não previsto
  - Alerta de velocidade excessiva
  - Geofencing (cercas virtuais)

---

### 8. 📱 APP DO MOTORISTA
**Status: 10% Implementado**

✅ **Implementado:**
- Interface básica (`/driver`)
- Autenticação

❌ **Faltando (CORE DO SISTEMA - PRIORIDADE ALTA):**
- **Checklist Obrigatório:**
  - Tabela `vehicle_checklists` (não existe)
  - Checklist antes de iniciar rota:
    - Nível de combustível
    - Pneus
    - Luzes
    - Freios
    - Limpeza
    - Documentos
  - Foto obrigatória do veículo
  - Não permitir iniciar rota sem checklist
  
- **Visualização da Rota:**
  - Lista de pontos de embarque/desembarque
  - Mapa com todos os pontos
  - Ordem de parada
  - Horário previsto para cada ponto
  
- **Navegação GPS:**
  - Integração com Google Maps / Waze
  - Navegação turn-by-turn
  - Recálculo automático de rota
  
- **Check-in/Check-out:**
  - Scanner NFC
  - Scanner QR Code
  - Lista de passageiros
  - Marcar presença manual
  - Confirmar embarque
  - Confirmar desembarque
  
- **Comunicação:**
  - Chat com a central (transportadora)
  - Enviar mensagens
  - Receber notificações
  - Reportar incidentes
  
- **Histórico:**
  - Viagens realizadas
  - Estatísticas (total de km, horas, viagens)
  - Avaliações recebidas

---

### 9. 📱 APP DO PASSAGEIRO
**Status: 5% Implementado**

✅ **Implementado:**
- Interface básica (`/passenger`)
- Autenticação

❌ **Faltando (CORE DO SISTEMA - PRIORIDADE ALTA):**
- **Informações da Rota:**
  - Horários de embarque
  - Pontos de embarque disponíveis
  - Tempo estimado de chegada
  - Rota do dia (manhã/tarde)
  
- **Rastreamento em Tempo Real:**
  - Ver ônibus no mapa
  - Posição em tempo real
  - ETA para o ponto do passageiro
  - Notificação de aproximação
  
- **Notificações:**
  - Push notification quando motorista inicia rota
  - Notificação quando ônibus está próximo (5 min)
  - Notificação de atraso
  - Notificação de cancelamento
  
- **Check-in/Check-out:**
  - QR Code pessoal
  - Validação de NFC (se tiver cartão)
  - Confirmação manual de embarque
  - Confirmação manual de desembarque
  
- **Comunicação:**
  - Enviar comentários
  - Enviar elogios
  - Enviar reclamações
  - Reportar incidentes
  - Canal direto com transportadora
  
- **Avaliação:**
  - Avaliar viagem ao final (1-5 estrelas)
  - Comentários opcionais
  - Avaliar motorista
  - Avaliar veículo
  - Avaliar pontualidade

---

### 10. 🚨 GESTÃO DE INCIDENTES
**Status: 15% Implementado**

✅ **Implementado:**
- Tabela básica para alertas
- Interface de alertas (`/admin/alertas`)
- API básica de alertas

❌ **Faltando (IMPORTANTE):**
- **Tabela Completa de Incidentes:**
  - `incidents` (não existe adequadamente)
  - Tipos: mecânico, acidente, atraso, comportamento, etc
  - Gravidade: baixa, média, alta, crítica
  - Status: aberto, em andamento, resolvido, fechado
  
- **Registro de Incidentes:**
  - Por motorista (via app)
  - Por passageiro (via app)
  - Por operador da empresa
  - Por Golf Fox
  - Por transportadora
  
- **Informações do Incidente:**
  - Tipo de incidente
  - Descrição detalhada
  - Localização (GPS)
  - Data e hora
  - Veículo envolvido
  - Motorista envolvido
  - Passageiros envolvidos
  - Fotos anexadas
  - Vídeos anexados
  
- **Fluxo de Tratamento:**
  - Notificação automática para responsáveis
  - Atribuição de responsável
  - Prazo para resolução
  - Acompanhamento de status
  - Histórico de ações
  - Resolução e fechamento
  
- **Dashboards:**
  - Incidentes abertos
  - Incidentes por tipo
  - Incidentes por gravidade
  - Tempo médio de resolução
  - Incidentes recorrentes
  
- **Análise:**
  - Incidentes por veículo
  - Incidentes por motorista
  - Incidentes por rota
  - Tendências
  - Ações preventivas

---

### 11. 💬 COMUNICAÇÃO E QUALIDADE
**Status: 10% Implementado**

❌ **Faltando (QUASE TUDO):**
- **Canal de Comunicação:**
  - Tabela `messages` (não existe)
  - Chat entre passageiro e transportadora
  - Chat entre motorista e central
  - Mensagens de grupo
  - Anexos (fotos, documentos)
  
- **Feedback de Passageiros:**
  - Tabela `passenger_feedbacks` (não existe)
  - Comentários gerais
  - Elogios
  - Reclamações
  - Sugestões
  - Dúvidas
  
- **Avaliações:**
  - Tabela `ratings` (não existe)
  - Avaliação da viagem (1-5 estrelas)
  - Avaliação do motorista
  - Avaliação do veículo
  - Avaliação da pontualidade
  - Comentários opcionais
  
- **Dashboard de Qualidade:**
  - Nota média geral
  - Nota média por motorista
  - Nota média por veículo
  - Nota média por transportadora
  - Evolução temporal
  - Comparativos
  
- **Ações:**
  - Responder feedbacks
  - Acompanhar reclamações
  - Premiar elogios
  - Implementar sugestões

---

### 12. 💰 GESTÃO DE CUSTOS
**Status: 50% Implementado**

✅ **Implementado:**
- Tabela `costs` e relacionadas
- Categorias de custos
- API de custos (`/api/costs`)
- Interface de custos (`/admin/custos`)
- Materialize views para consolidação

❌ **Faltando:**
- **Custos por Veículo:**
  - Combustível (registro detalhado)
  - Manutenções (vínculo com manutenções)
  - Seguro
  - IPVA
  - Depreciação
  - Lavagem
  - Pneus
  - Outros
  
- **Custos por Rota:**
  - Custo estimado vs realizado
  - Custo por km
  - Custo por passageiro
  - Custo por viagem
  
- **Controle Orçamentário:**
  - Orçamento mensal
  - Orçamento anual
  - Alertas de estouro
  - Comparativo previsto vs realizado
  
- **Relatórios Financeiros:**
  - Por empresa
  - Por transportadora
  - Por veículo
  - Por rota
  - Por motorista
  - Exportação (Excel, PDF)

---

### 13. 📊 RELATÓRIOS E DASHBOARDS
**Status: 40% Implementado**

✅ **Implementado:**
- Interface de relatórios (`/admin/relatorios`)
- KPIs básicos (`/api/admin/kpis`)
- Relatórios agendados (estrutura)
- Export de dados

❌ **Faltando (MUITOS RELATÓRIOS):**

**Relatórios Operacionais:**
- Viagens realizadas (total, por período)
- Pontualidade (chegadas no horário vs atrasadas)
- Taxa de ocupação (passageiros / capacidade)
- Quilometragem percorrida
- Tempo médio de viagem
- Desvios de rota
- Paradas não programadas
- Check-ins / No-shows
- Incidentes por período
- Performance por motorista
- Performance por veículo

**Relatórios Financeiros:**
- Custos consolidados
- Custos por categoria
- Custos por veículo
- Custos por rota
- ROI (Return on Investment)
- Custos por passageiro transportado
- Previsão vs realizado

**Relatórios de Qualidade:**
- Avaliações médias
- Feedbacks por período
- Reclamações vs elogios
- NPS (Net Promoter Score)
- Satisfação por transportadora
- Satisfação por motorista

**Dashboards Personalizados:**
- Dashboard Golf Fox (visão global)
- Dashboard Empresa (visão da empresa)
- Dashboard Transportadora (visão da transportadora)
- Filtros dinâmicos
- Gráficos interativos
- Export de dashboards

---

### 14. 📋 GESTÃO DE CONTRATOS
**Status: 5% Implementado**

❌ **Faltando (QUASE TUDO):**
- **Tabela de Contratos:**
  - `contracts` (não existe)
  - Contrato entre Golf Fox e Empresa
  - Contrato entre Golf Fox e Transportadora
  
- **Informações do Contrato:**
  - Número do contrato
  - Partes envolvidas
  - Data de início
  - Data de término
  - Valor mensal
  - Forma de pagamento
  - Cláusulas importantes
  - Documentos anexos (PDF do contrato)
  
- **Gestão:**
  - Status: ativo, suspenso, encerrado
  - Renovações automáticas
  - Alertas de vencimento
  - Histórico de alterações
  - Aditivos contratuais
  
- **Financeiro:**
  - Faturamento por contrato
  - Pagamentos realizados
  - Pagamentos pendentes
  - Inadimplência

---

### 15. 🚑 GESTÃO DE SOCORRO E SUPORTE
**Status: 20% Implementado**

✅ **Implementado:**
- Interface de socorro (`/admin/socorro`)
- Estrutura básica de assistência
- API de assistance-requests

❌ **Faltando:**
- **Tipos de Socorro:**
  - Pane mecânica
  - Acidente
  - Emergência médica
  - Segurança
  - Outros
  
- **Fluxo de Atendimento:**
  - Solicitação via app (motorista/passageiro)
  - Notificação imediata para responsáveis
  - Atribuição de responsável
  - Acionamento de recursos (guincho, ambulância, polícia)
  - Acompanhamento em tempo real
  - Resolução e fechamento
  
- **Informações:**
  - Localização GPS precisa
  - Tipo de ocorrência
  - Gravidade
  - Pessoas envolvidas
  - Fotos/vídeos
  - Contatos de emergência
  
- **Dashboard:**
  - Solicitações abertas
  - Tempo médio de atendimento
  - Taxa de resolução
  - Histórico

---

### 16. 🔔 SISTEMA DE NOTIFICAÇÕES
**Status: 10% Implementado**

❌ **Faltando (CRÍTICO):**
- **Tabela de Notificações:**
  - `notifications` (básica existe, precisa melhorar)
  - Tipo de notificação
  - Destinatário
  - Conteúdo
  - Status: enviada, lida, arquivada
  
- **Canais:**
  - Push notifications (mobile)
  - Email
  - SMS
  - In-app notifications
  
- **Tipos de Notificações:**
  - Rota iniciada
  - Motorista a caminho
  - Motorista próximo (5 min)
  - Check-in realizado
  - Atraso na rota
  - Incidente reportado
  - Manutenção vencendo
  - Documento vencendo
  - Contrato vencendo
  - Novo feedback recebido
  
- **Preferências:**
  - Por usuário
  - Habilitar/desabilitar por tipo
  - Escolher canais preferenciais
  - Horários permitidos

---

### 17. 📱 APPS MOBILE (Flutter)
**Status: 5% Implementado**

✅ **Implementado:**
- Estrutura básica do projeto Flutter (`apps/mobile`)
- Configuração inicial

❌ **Faltando (QUASE TUDO):**
- **App do Motorista:**
  - Tela de login
  - Dashboard
  - Lista de rotas
  - Mapa de navegação
  - Checklist de veículo
  - Check-in/Check-out de passageiros
  - NFC reader
  - QR Code scanner
  - Chat com central
  - Histórico de viagens
  - Configurações
  
- **App do Passageiro:**
  - Tela de login
  - Dashboard
  - Informações da rota
  - Mapa em tempo real
  - QR Code pessoal
  - NFC card support
  - Check-in/Check-out
  - Notificações
  - Avaliação de viagens
  - Feedback
  - Histórico
  - Configurações

---

## 📊 RESUMO POR MÓDULO

| Módulo | % Implementado | Status | Prioridade |
|--------|---------------|---------|-----------|
| Gestão de Empresas | 70% | 🟡 Parcial | Média |
| Gestão de Usuários | 85% | 🟢 Quase Completo | Baixa |
| Gestão de Frota (Admin) | 60% | 🟡 Parcial | Alta |
| **Painel da Transportadora** | **25%** | 🔴 **Incompleto** | **CRÍTICA** |
| ↳ Gestão Motoristas (Carrier) | 10% | 🔴 Crítico | **CRÍTICA** |
| ↳ Gestão Frota (Carrier) | 35% | 🔴 Crítico | **CRÍTICA** |
| ↳ Mapa Tempo Real (Carrier) | 45% | 🟡 Parcial | **CRÍTICA** |
| ↳ Controle Custos (Carrier) | 15% | 🔴 Crítico | **CRÍTICA** |
| Gestão de Motoristas (Admin) | 40% | 🔴 Incompleto | Alta |
| Planejamento de Rotas | 55% | 🟡 Parcial | Alta |
| Check-in/Check-out | 20% | 🔴 Incompleto | **CRÍTICA** |
| Rastreamento GPS | 45% | 🟡 Parcial | **CRÍTICA** |
| App do Motorista | 10% | 🔴 Incompleto | **CRÍTICA** |
| App do Passageiro | 5% | 🔴 Incompleto | **CRÍTICA** |
| Gestão de Incidentes | 15% | 🔴 Incompleto | Alta |
| Comunicação/Qualidade | 10% | 🔴 Incompleto | Alta |
| Gestão de Custos (Admin) | 50% | 🟡 Parcial | Média |
| Relatórios/Dashboards | 40% | 🟡 Parcial | Média |
| Gestão de Contratos | 5% | 🔴 Incompleto | Baixa |
| Socorro/Suporte | 20% | 🔴 Incompleto | Alta |
| Notificações | 10% | 🔴 Incompleto | Alta |
| Apps Mobile | 5% | 🔴 Incompleto | **CRÍTICA** |

---

## 🎯 PRIORIZAÇÃO SUGERIDA

### 🔴 PRIORIDADE CRÍTICA (CORE DO SISTEMA)

1. **🏢 PAINEL DA TRANSPORTADORA (CARRIER) - NOVO!**
   - **Gestão de Motoristas (Cadastro Completo):**
     - Tabela `driver_documents` e `driver_medical_exams`
     - Upload de CNH, exames médicos, documentos
     - Controle de vencimentos com alertas
     - Dashboard de conformidade
     - Interface completa de cadastro
   
   - **Gestão de Frota (Documentos e Manutenções):**
     - Tabela `vehicle_documents` e `vehicle_maintenances`
     - CRLV, IPVA, Seguro, Inspeção
     - Manutenções preventivas e corretivas
     - Controle de custos por manutenção
     - Alertas de vencimento
   
   - **Mapa em Tempo Real (Visão Completa):**
     - Pontos de embarque/desembarque por veículo
     - Pontos por rota com polyline
     - Passageiros em tempo real (3/15)
     - Atualização automática (WebSocket/polling)
     - Filtros e clustering
   
   - **Controle de Custos (Por Veículo e Rota):**
     - Tabela `vehicle_costs` detalhada
     - Tabela `route_costs`
     - Custos operacionais completos
     - Dashboard de custos por veículo/rota
     - Rentabilidade e ROI

2. **Check-in/Check-out de Passageiros**
   - Sistema NFC completo
   - Sistema QR Code completo
   - Registro manual
   - Histórico de presença

3. **App do Motorista (Flutter)**
   - Checklist obrigatório
   - Navegação GPS
   - Check-in/Check-out
   - Comunicação

4. **App do Passageiro (Flutter)**
   - Rastreamento em tempo real
   - QR Code / NFC
   - Notificações
   - Avaliações

5. **Rastreamento GPS em Tempo Real**
   - Mapa global (Golf Fox)
   - Mapa por empresa
   - Mapa por transportadora
   - Atualização em tempo real

### 🟠 PRIORIDADE ALTA

6. **Gestão Completa de Motoristas (Admin)**
   - Documentação (CNH, exames)
   - Controle de vencimentos
   - Histórico e performance

7. **Gestão Completa de Frota (Admin)**
   - Documentação de veículos
   - Manutenções (programadas e realizadas)
   - Custos operacionais
   - Status em tempo real

8. **Planejamento de Rotas Completo**
   - Turnos e horários
   - Pontos detalhados
   - Rotas de ida e volta
   - Validações automáticas

9. **Gestão de Incidentes**
   - Registro completo
   - Fluxo de tratamento
   - Dashboards
   - Análises

10. **Sistema de Notificações**
    - Push notifications
    - Email/SMS
    - Preferências por usuário
    - Todos os tipos de eventos

### 🟡 PRIORIDADE MÉDIA

11. **Comunicação e Qualidade**
    - Chat integrado
    - Feedback de passageiros
    - Avaliações
    - Dashboard de qualidade

12. **Gestão de Custos Completa (Admin)**
    - Custos por veículo (Admin)
    - Custos por rota (Admin)
    - Controle orçamentário
    - Relatórios financeiros

13. **Relatórios e Dashboards**
    - Relatórios operacionais
    - Relatórios financeiros
    - Relatórios de qualidade
    - Dashboards personalizados

### 🟢 PRIORIDADE BAIXA

14. **Gestão de Contratos**
    - Contratos digitais
    - Gestão de vencimentos
    - Faturamento

15. **Branding e Personalização**
    - Logo e cores por empresa
    - Temas personalizados

---

## 📈 ESTIMATIVA DE DESENVOLVIMENTO

### CRÍTICO (4-5 meses)
- **Painel da Transportadora: 6 semanas**
  - Gestão Motoristas (Carrier): 2 semanas
  - Gestão Frota (Carrier): 2 semanas
  - Mapa Tempo Real Avançado: 1,5 semanas
  - Controle de Custos (Carrier): 0,5 semanas
- Check-in/Check-out: 3 semanas
- App Motorista: 6 semanas
- App Passageiro: 6 semanas
- GPS Tempo Real: 4 semanas

### ALTA (2-3 meses)
- Gestão Motoristas: 3 semanas
- Gestão Frota: 3 semanas
- Rotas Completo: 2 semanas
- Incidentes: 2 semanas
- Notificações: 2 semanas

### MÉDIA (1-2 meses)
- Comunicação: 2 semanas
- Custos: 2 semanas
- Relatórios: 3 semanas

### BAIXA (3-4 semanas)
- Contratos: 2 semanas
- Branding: 1 semana

**TOTAL ESTIMADO: 9-11 meses de desenvolvimento**

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### **Fase 1 (4-5 meses) - CRÍTICO**
1. **Painel da Transportadora (6 semanas)**
2. Apps Mobile (Motorista + Passageiro) (12 semanas)
3. Check-in/Check-out (3 semanas)
4. GPS Tempo Real (4 semanas)

### **Fase 2 (2-3 meses) - ALTA**
1. Gestão Motoristas (Admin) (3 semanas)
2. Gestão Frota (Admin) (3 semanas)
3. Rotas Completo (2 semanas)
4. Incidentes (2 semanas)
5. Notificações (2 semanas)

### **Fase 3 (1-2 meses) - MÉDIA**
1. Comunicação e Qualidade (2 semanas)
2. Custos (Admin) (2 semanas)
3. Relatórios e Dashboards (3 semanas)

### **Fase 4 (3-4 semanas) - BAIXA**
1. Contratos (2 semanas)
2. Branding/Personalização (1 semana)
3. Refinamentos e ajustes finais

---

## 📊 STATUS GERAL DO PROJETO

- **Implementação atual:** ~30-35%
- **Falta implementar:** ~65-70%
- **Tempo para MVP funcional:** 4-5 meses (Fase 1)
- **Tempo para sistema completo:** 9-11 meses (todas as fases)

**⚠️ IMPORTANTE:** O **Painel da Transportadora** é CRÍTICO e deve ser implementado na Fase 1, pois é a interface principal para as transportadoras gerenciarem motoristas, frota, mapa em tempo real e custos.

---

**Criado em:** 16/11/2025  
**Atualizado em:** 16/11/2025 (adicionado Painel da Transportadora)  
**Versão:** 2.0 - Análise Completa com Painel da Transportadora

