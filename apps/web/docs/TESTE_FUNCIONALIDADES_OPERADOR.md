# Guia de Testes - Funcionalidades do Operador

Este documento contém um checklist completo para testar todas as funcionalidades do painel do operador.

## Pré-requisitos

- [ ] Conta de operador criada no Supabase Auth
- [ ] Operador mapeado para empresa via `gf_user_company_map`
- [ ] Branding configurado para a empresa
- [ ] Dados de teste populados (rotas, funcionários, alertas)

## 1. Login e Seleção de Empresa

### 1.1 Login
- [ ] Acessar `/operator`
- [ ] Realizar login com credenciais de operador
- [ ] Redirecionamento para `/operator` após login bem-sucedido

### 1.2 Seleção de Empresa
- [ ] Se múltiplas empresas: seletor de empresa aparece
- [ ] Selecionar empresa funciona
- [ ] Empresa selecionada é persistida (localStorage)
- [ ] Troca de empresa atualiza dados do dashboard

### 1.3 Branding
- [ ] Logo da empresa aparece no topbar
- [ ] Nome da empresa aparece no topbar (não "GOLF FOX")
- [ ] Cores primárias aplicadas (botões, links)
- [ ] Cores secundárias aplicadas (backgrounds, bordas)

## 2. Dashboard

### 2.1 KPIs
- [ ] KPIs carregam corretamente
- [ ] Números não são 0 (se houver dados)
- [ ] KPIs exibidos:
  - [ ] Viagens hoje
  - [ ] Viagens em progresso
  - [ ] Taxa de ocupação média
  - [ ] Custo diário
  - [ ] Alertas não resolvidos
- [ ] KPIs são filtrados por empresa (isolamento)

### 2.2 Gráficos
- [ ] Gráficos carregam dados
- [ ] Dados são específicos da empresa
- [ ] Interatividade funciona (hover, tooltips)

### 2.3 Atualização
- [ ] Dados são atualizados periodicamente
- [ ] Materialized view é atualizada via cron job

## 3. Rotas

### 3.1 Listagem
- [ ] Lista de rotas carrega
- [ ] Rotas são filtradas por empresa
- [ ] Informações exibidas:
  - [ ] Nome da rota
  - [ ] Total de viagens
  - [ ] Viagens concluídas
  - [ ] Status
- [ ] Busca/filtros funcionam

### 3.2 Mapa
- [ ] Botão "Ver no mapa" funciona
- [ ] Mapa carrega com rotas
- [ ] `fitBounds` aplicado com 20% de padding
- [ ] Tooltips aparecem ao passar mouse
- [ ] Timeline de viagens funciona
- [ ] Clustering de marcadores funciona
- [ ] Filtros são preservados na URL

### 3.3 Otimização
- [ ] Botão "Otimizar rota" funciona
- [ ] API `/api/operator/optimize-route` responde
- [ ] Resultado da otimização é exibido
- [ ] Cache de otimização funciona

## 4. Funcionários

### 4.1 Listagem
- [ ] Lista de funcionários carrega
- [ ] Funcionários são filtrados por empresa
- [ ] Informações exibidas:
  - [ ] Nome
  - [ ] CPF
  - [ ] Endereço
  - [ ] Telefone
  - [ ] Email
- [ ] Busca funciona

### 4.2 Importação CSV
- [ ] Botão "Importar CSV" funciona
- [ ] Upload de arquivo funciona
- [ ] Validação de formato:
  - [ ] Colunas obrigatórias presentes
  - [ ] CPF válido
  - [ ] Email válido
- [ ] Dry-run funciona (preview antes de importar)
- [ ] Geocodificação em lote:
  - [ ] Endereços são geocodificados
  - [ ] Latitude/longitude são salvos
  - [ ] Erros de geocodificação são reportados
- [ ] Upsert funciona (atualiza se existir, cria se não)
- [ ] Feedback de sucesso/erro

### 4.3 Criação Manual
- [ ] Botão "Novo Funcionário" funciona
- [ ] Formulário de criação funciona
- [ ] Validações funcionam
- [ ] Geocodificação automática ao salvar endereço
- [ ] Funcionário é criado corretamente

## 5. Alertas

### 5.1 Listagem
- [ ] Lista de alertas carrega
- [ ] Alertas são filtrados por empresa
- [ ] Tipos de alerta exibidos:
  - [ ] Atrasos (route_delayed)
  - [ ] Ônibus parado (bus_stopped)
  - [ ] Desvio (deviation)
  - [ ] Passageiro não embarcou (passenger_not_embarked)
  - [ ] Checklist faltando (checklist_missing)
- [ ] Severidade exibida (info, warning, critical)
- [ ] Filtros por tipo/severidade funcionam

### 5.2 Ações
- [ ] Marcar como lido funciona
- [ ] Marcar como resolvido funciona
- [ ] Resolver alerta atualiza status
- [ ] Alertas resolvidos podem ser filtrados

## 6. Custos

### 6.1 Visualização
- [ ] Resumo de custos carrega
- [ ] Custos são filtrados por empresa
- [ ] Dados exibidos:
  - [ ] Custo total
  - [ ] Custo por rota
  - [ ] Custo por veículo
  - [ ] Gráficos de custos

### 6.2 Conciliação
- [ ] Botão "Conciliação" funciona
- [ ] Modal de conciliação abre
- [ ] Dados de conciliação carregam:
  - [ ] Viagens medidos
  - [ ] Viagens faturados
  - [ ] Diferenças calculadas
- [ ] Sinalização de divergências:
  - [ ] Divergência >5% é sinalizada
  - [ ] Divergência >R$100 é sinalizada
- [ ] Exportação de relatório de conciliação

## 7. Relatórios

### 7.1 Geração
- [ ] Lista de relatórios disponíveis:
  - [ ] Atrasos (v_reports_delays_secure)
  - [ ] Ocupação (v_reports_occupancy_secure)
  - [ ] Não embarcados (v_reports_not_boarded_secure)
  - [ ] Eficiência (v_reports_efficiency_secure)
  - [ ] ROI/SLA (v_reports_roi_sla_secure)
- [ ] Seleção de período funciona
- [ ] Filtros por empresa funcionam
- [ ] Botão "Gerar" funciona

### 7.2 Exportação
- [ ] Exportação CSV funciona
- [ ] Exportação Excel funciona
- [ ] Dados exportados são corretos
- [ ] Formato do arquivo está correto

### 7.3 Agendamento
- [ ] Criar agendamento funciona
- [ ] Configuração de cron funciona
- [ ] Destinatários configuráveis
- [ ] Agendamentos ativos são listados
- [ ] Cron job executa e envia emails

## 8. Comunicações

### 8.1 Listagem
- [ ] Lista de comunicações carrega
- [ ] Comunicações são filtradas por empresa
- [ ] Tipos de comunicação:
  - [ ] Anúncios
  - [ ] Avisos
  - [ ] Notificações

### 8.2 Criação
- [ ] Botão "Criar Broadcast" funciona
- [ ] Formulário de criação funciona
- [ ] Seleção de destinatários funciona
- [ ] Envio funciona
- [ ] Broadcast "teste" pode ser criado

## 9. Prestadores

### 8.1 Listagem
- [ ] Lista de prestadores carrega
- [ ] Prestadores são filtrados por empresa
- [ ] Informações exibidas:
  - [ ] Nome
  - [ ] Contato
  - [ ] Status
- [ ] Visualização é somente leitura

## 10. Solicitações

### 10.1 Listagem
- [ ] Lista de solicitações carrega
- [ ] Solicitações são filtradas por empresa
- [ ] Tipos de solicitação:
  - [ ] Suporte
  - [ ] Manutenção
  - [ ] Outros
- [ ] Status exibido (pendente, em andamento, concluída)

## 11. Conformidade

### 11.1 Documentos
- [ ] Lista de documentos carrega
- [ ] Documentos são filtrados por empresa
- [ ] Tipos de documento:
  - [ ] Licenças
  - [ ] Certificados
  - [ ] Outros
- [ ] Validade exibida
- [ ] Alertas de vencimento

## 12. Preferências

### 12.1 Configurações
- [ ] Configurações carregam
- [ ] Configurações são específicas da empresa
- [ ] Salvamento funciona
- [ ] Integrações configuráveis

## 13. Isolamento Multi-tenant

### 13.1 Isolamento de Dados
- [ ] Operador A vê apenas dados da Empresa A
- [ ] Operador B vê apenas dados da Empresa B
- [ ] Troca de empresa atualiza dados corretamente
- [ ] RLS policies funcionam corretamente

### 13.2 Views Seguras
- [ ] `v_operator_dashboard_kpis_secure` retorna dados corretos
- [ ] `v_operator_routes_secure` retorna rotas corretas
- [ ] `v_operator_alerts_secure` retorna alertas corretos
- [ ] `v_operator_costs_secure` retorna custos corretos

## 14. Performance

### 14.1 Carregamento
- [ ] Páginas carregam em <3s
- [ ] Lazy loading funciona
- [ ] Virtualização em listas grandes funciona
- [ ] Debounce em buscas funciona

### 14.2 Memoização
- [ ] Componentes são memoizados quando necessário
- [ ] Cálculos pesados são memoizados
- [ ] Re-renders desnecessários evitados

## 15. Acessibilidade (A11y)

### 15.1 Navegação
- [ ] Navegação por teclado funciona
- [ ] Foco visível
- [ ] Ordem de tabulação lógica

### 15.2 ARIA
- [ ] Labels ARIA presentes
- [ ] Roles corretos
- [ ] Estados anunciados

### 15.3 Contraste
- [ ] Contraste de cores adequado
- [ ] Texto legível

## 16. Testes de Cron Jobs

### 16.1 Refresh KPIs
- [ ] Endpoint `/api/cron/refresh-kpis` responde 200
- [ ] Materialized view `mv_operator_kpis` é atualizada
- [ ] CRON_SECRET autentica corretamente
- [ ] Execução automática funciona (a cada 5 minutos)

### 16.2 Dispatch Reports
- [ ] Endpoint `/api/cron/dispatch-reports` responde 200
- [ ] Relatórios agendados são processados
- [ ] Emails são enviados (se configurado)
- [ ] Histórico é registrado em `gf_report_history`
- [ ] Execução automática funciona (a cada 15 minutos)

## 17. Health Check

### 17.1 Endpoint
- [ ] `GET /api/health` responde
- [ ] Retorna `{ ok: true, supabase: 'ok' }`
- [ ] Detecta erros de conexão com Supabase

## Checklist de Aceite Final

- [ ] Todas as funcionalidades acima testadas
- [ ] Nenhum erro crítico encontrado
- [ ] Dados isolados corretamente por empresa
- [ ] Branding aplicado corretamente
- [ ] Cron jobs funcionando
- [ ] Performance aceitável
- [ ] Acessibilidade básica atendida

## Notas de Teste

**Data do Teste:** _______________
**Testador:** _______________
**Ambiente:** [ ] Staging [ ] Produção
**Empresa Testada:** _______________

**Problemas Encontrados:**
1. 
2. 
3. 

**Observações:**
- CRON Jobs: `refresh-kpis` e `dispatch-reports` responderam com 401/500 em produção
- Verificar header `Authorization: Bearer <CRON_SECRET>` no cliente
- Confirmar método correto para cada endpoint (GET/POST)
- Acompanhar 3 ciclos de cron para consistência de execução

