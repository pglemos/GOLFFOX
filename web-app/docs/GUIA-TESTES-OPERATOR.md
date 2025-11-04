# Guia de Testes - Painel do Operador Multi-tenant

## 🎯 Objetivo

Este guia fornece um checklist completo para testar todas as funcionalidades do painel do operador multi-tenant.

## 📋 Pré-requisitos

- [ ] Migrations v43 executadas no Supabase
- [ ] Empresas configuradas usando `scripts/setup-operator-company-interactive.js`
- [ ] Operadores mapeados às empresas
- [ ] Branding configurado para cada empresa
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Aplicação deployada e funcionando

## 🧪 Teste 1: Login e Seleção de Empresa

### Passos

1. **Fazer login como operador**
   - Acesse a aplicação
   - Faça login com credenciais de um operador
   - Verifique se o login é bem-sucedido

2. **Verificar seletor de empresas**
   - Verifique se aparece um seletor de empresas no header
   - Verifique se mostra todas as empresas mapeadas ao operador
   - Verifique se o logo da empresa aparece (se configurado)

3. **Testar troca de empresa**
   - Selecione uma empresa diferente
   - Verifique se a URL atualiza com `?company=`
   - Verifique se o localStorage persiste a seleção
   - Recarregue a página e verifique se a seleção persiste

4. **Verificar branding**
   - Verifique se o nome da empresa aparece no header
   - Verifique se o logo aparece (se configurado)
   - Verifique se as cores do branding são aplicadas (se configurado)

### Resultado Esperado

✅ Seletor aparece no header  
✅ Logo da empresa aparece  
✅ Troca de empresa funciona  
✅ URL e localStorage atualizados  
✅ Branding aplicado corretamente

---

## 🧪 Teste 2: Dashboard e KPIs

### Passos

1. **Acessar dashboard**
   - Acesse `/operator`
   - Verifique se a página carrega sem erros

2. **Verificar KPIs**
   - Verifique se os seguintes KPIs aparecem:
     - Viagens Hoje
     - Em Andamento
     - Concluídas
     - Atrasos >5min
     - Ocupação Média
     - Custo/Dia (empresa)
     - SLA D+0 (empresa)
   - Verifique se os valores são corretos para a empresa selecionada

3. **Testar isolamento multi-tenant**
   - Selecione empresa A
   - Anote os valores dos KPIs
   - Selecione empresa B
   - Verifique se os KPIs mudam (devem ser diferentes se houver dados)
   - Verifique se não há dados da empresa A

4. **Testar botão de refresh**
   - Clique no botão de refresh
   - Verifique se os KPIs atualizam

5. **Verificar Torre de Controle**
   - Verifique se os cards da Torre de Controle aparecem
   - Verifique se os alertas são específicos da empresa
   - Clique nos cards e verifique se redirecionam corretamente

### Resultado Esperado

✅ KPIs carregam corretamente  
✅ Valores são específicos da empresa  
✅ Isolamento funciona (empresa A não vê dados da empresa B)  
✅ Botão de refresh funciona  
✅ Torre de Controle funciona

---

## 🧪 Teste 3: Multi-tenant (Isolamento de Dados)

### Passos

1. **Preparar dados de teste**
   - Crie dados de teste para empresa A (rotas, viagens, alertas)
   - Crie dados de teste para empresa B (rotas, viagens, alertas)

2. **Testar como Operador A (Empresa A)**
   - Faça login como operador mapeado à empresa A
   - Acesse cada página do operador
   - Verifique se vê apenas dados da empresa A
   - Verifique se NÃO vê dados da empresa B

3. **Testar como Operador B (Empresa B)**
   - Faça login como operador mapeado à empresa B
   - Acesse cada página do operador
   - Verifique se vê apenas dados da empresa B
   - Verifique se NÃO vê dados da empresa A

4. **Testar operador com múltiplas empresas**
   - Faça login como operador mapeado a múltiplas empresas
   - Teste trocar entre empresas
   - Verifique se os dados mudam corretamente
   - Verifique se não há "vazamento" de dados entre empresas

### Resultado Esperado

✅ Operador A vê apenas dados da empresa A  
✅ Operador B vê apenas dados da empresa B  
✅ Troca de empresa funciona corretamente  
✅ Não há vazamento de dados entre empresas  
✅ RLS está funcionando corretamente

---

## 🧪 Teste 4: Funcionários

### Passos

1. **Acessar página de funcionários**
   - Acesse `/operator/funcionarios`
   - Verifique se a página carrega sem erros

2. **Verificar lista de funcionários**
   - Verifique se apenas funcionários da empresa selecionada aparecem
   - Verifique se os dados estão corretos (nome, CPF, email, etc.)

3. **Testar importação CSV (Dry-run)**
   - Clique em "Importar CSV"
   - Selecione um arquivo CSV de teste
   - Verifique se o preview aparece
   - Verifique se os erros são detectados
   - Verifique se o geocoding é executado (se endereços fornecidos)

4. **Testar importação CSV (Real)**
   - Após dry-run, execute a importação real
   - Verifique se os funcionários são criados
   - Verifique se o geocoding foi executado (lat/lng preenchidos)
   - Verifique se o relatório pós-importação aparece

5. **Testar criação manual**
   - Clique em "Novo Funcionário"
   - Preencha os dados
   - Verifique se o geocoding funciona ao salvar
   - Verifique se o funcionário aparece na lista

### Resultado Esperado

✅ Lista filtra por empresa  
✅ Importação CSV funciona (dry-run e real)  
✅ Geocoding funciona  
✅ Relatório pós-importação aparece  
✅ Criação manual funciona

---

## 🧪 Teste 5: Rotas e Mapa

### Passos

1. **Acessar página de rotas**
   - Acesse `/operator/rotas`
   - Verifique se apenas rotas da empresa aparecem
   - Verifique se os dados estão corretos

2. **Testar otimização de rota**
   - Selecione uma rota
   - Clique em "Otimizar Rota"
   - Verifique se a otimização é executada
   - Verifique se o resultado é salvo

3. **Acessar mapa**
   - Acesse `/operator/rotas/mapa` ou clique em "Ver no Mapa"
   - Verifique se o mapa carrega

4. **Verificar features do mapa**
   - **Polyline**: Verifique se a rota aparece (linha verde 4px)
   - **Markers**: Verifique se aparecem círculos (pickup) e quadrados (dropoff)
   - **Numeração**: Verifique se os markers têm numeração sequencial
   - **Tooltips**: Passe o mouse sobre um marker e verifique se o tooltip aparece
   - **Tooltip persistente**: Clique em um marker e verifique se o tooltip permanece
   - **Timeline**: Verifique se aparece "X% concluído" e "HH:MM restantes"
   - **Auto-zoom**: Verifique se o mapa ajusta automaticamente (fitBounds com 20% margin)

5. **Testar filtros**
   - Aplique filtros (shift, status, período)
   - Verifique se os filtros persistem na URL
   - Verifique se o mapa atualiza

6. **Testar realtime** (se aplicável)
   - Verifique se os dados atualizam a cada 5s
   - Verifique se há debounce (300ms)

### Resultado Esperado

✅ Rotas filtradas por empresa  
✅ Otimização funciona  
✅ Mapa carrega corretamente  
✅ Todas as features do mapa funcionam  
✅ Filtros persistem na URL  
✅ Realtime funciona (se aplicável)

---

## 🧪 Teste 6: Custos e Reconciliação

### Passos

1. **Acessar página de custos**
   - Acesse `/operator/custos`
   - Verifique se apenas custos da empresa aparecem

2. **Verificar visualização de custos**
   - Verifique se os dados estão corretos
   - Verifique se os gráficos aparecem (se implementados)

3. **Testar modal de reconciliação**
   - Clique em "Reconciliar" em um custo com divergência
   - Verifique se o modal abre
   - Verifique se os dados são exibidos corretamente:
     - Custo medido
     - Custo faturado
     - Divergência calculada

4. **Testar detecção de discrepâncias**
   - Verifique se discrepâncias >5% ou >R$100 são detectadas
   - Verifique se aparecem destacadas

5. **Testar ações de reconciliação**
   - **Aprovar**: Clique em "Aprovar" e verifique se o status muda
   - **Rejeitar**: Clique em "Rejeitar" e verifique se o status muda
   - **Solicitar Revisão**: Clique em "Solicitar Revisão" e verifique se o status muda

6. **Testar exportação**
   - Clique em "Exportar" (CSV/Excel/PDF)
   - Verifique se o arquivo é gerado
   - Verifique se contém logo da empresa (se configurado)
   - Verifique se NÃO contém "GOLF FOX"

### Resultado Esperado

✅ Custos filtrados por empresa  
✅ Modal de reconciliação funciona  
✅ Discrepâncias são detectadas  
✅ Ações de reconciliação funcionam  
✅ Exportação funciona com branding da empresa

---

## 🧪 Teste 7: Relatórios

### Passos

1. **Acessar página de relatórios**
   - Acesse `/operator/relatorios`
   - Verifique se a página carrega

2. **Verificar catálogo de relatórios**
   - Verifique se os relatórios disponíveis aparecem
   - Verifique se são específicos da empresa

3. **Testar "Executar agora"**
   - Selecione um relatório
   - Clique em "Executar agora"
   - Verifique se o relatório é gerado
   - Verifique se o download funciona

4. **Testar agendamento de relatório**
   - Clique em "Agendar"
   - Configure cron (ex: `0 9 * * 1` para toda segunda às 9h)
   - Configure destinatários
   - Salve o agendamento
   - Verifique se aparece na lista de agendamentos

5. **Verificar histórico de relatórios**
   - Acesse o histórico
   - Verifique se os relatórios executados aparecem
   - Verifique se os detalhes estão corretos

6. **Verificar email** (se configurado)
   - Verifique se o email é enviado quando o relatório é agendado
   - Verifique se o anexo está correto
   - Verifique se o branding da empresa aparece no email

### Resultado Esperado

✅ Catálogo de relatórios funciona  
✅ "Executar agora" funciona  
✅ Agendamento funciona  
✅ Histórico funciona  
✅ Email funciona (se configurado)

---

## 🧪 Teste 8: Vercel Cron

### Passos

1. **Verificar logs do cron job**
   - Acesse Vercel Dashboard
   - Vá em Deployments → Functions → `/api/cron/refresh-kpis`
   - Verifique se há execuções recentes
   - Verifique se não há erros

2. **Verificar materialized view**
   - Acesse o Supabase SQL Editor
   - Execute: `SELECT * FROM mv_operator_kpis WHERE company_id = 'seu-id';`
   - Verifique se os dados estão atualizados
   - Verifique se `last_refreshed_at` está recente

3. **Testar endpoint manualmente**
   - Faça uma requisição POST para `/api/cron/refresh-kpis`
   - Inclua o header: `Authorization: Bearer seu-CRON_SECRET`
   - Verifique se retorna 200
   - Verifique se a materialized view é atualizada

### Resultado Esperado

✅ Cron job executa a cada 5 minutos  
✅ Materialized view é atualizada  
✅ Não há erros nos logs  
✅ Endpoint protegido com CRON_SECRET

---

## 📊 Checklist Final

### Funcionalidades Core
- [ ] Login funciona
- [ ] Seleção de empresa funciona
- [ ] Dashboard carrega KPIs corretos
- [ ] Isolamento multi-tenant funciona
- [ ] Todas as páginas usam views seguras

### Funcionalidades Específicas
- [ ] Importação CSV de funcionários funciona
- [ ] Geocoding funciona
- [ ] Mapa com todas as features funciona
- [ ] Reconciliação de custos funciona
- [ ] Relatórios agendados funcionam

### Branding e UI
- [ ] Logo da empresa aparece
- [ ] Nome da empresa aparece
- [ ] Cores do branding aplicadas
- [ ] Zero "GOLF FOX" no UI (exceto footer legal)
- [ ] Exports com logo da empresa

### Performance e Segurança
- [ ] RLS funcionando
- [ ] Views seguras funcionando
- [ ] Cron job funcionando
- [ ] Sem erros no console
- [ ] Performance aceitável

---

## 🐛 Troubleshooting

### Problema: KPIs não aparecem
**Solução**: Verifique se `mv_operator_kpis` foi populado e se há dados nas tabelas base.

### Problema: Operador não vê empresas
**Solução**: Verifique se o operador está mapeado em `gf_user_company_map`.

### Problema: Dados de outra empresa aparecem
**Solução**: Verifique se RLS está ativo e se as views seguras estão sendo usadas.

### Problema: Cron não executa
**Solução**: Verifique se `CRON_SECRET` está configurado e se o `vercel.json` está correto.

---

**Última atualização**: Data da implementação  
**Próxima revisão**: Após testes em produção

