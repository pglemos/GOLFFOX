# Guia de Uso - Sistema de Custos

## Visão Geral

O sistema de custos do GOLF FOX oferece uma gestão completa e detalhada de todos os custos operacionais, permitindo rastreamento, análise e conciliação com faturas.

## Funcionalidades Principais

### 1. Visão Geral

A aba "Visão Geral" apresenta:
- **KPIs Principais**: Custo Total, Custo/KM, Custo/Viagem, Variação vs Orçamento
- **Gráficos**: Evolução mensal (últimos 12 meses), distribuição por grupo de custos
- **Alertas**: Notificações de divergências significativas do orçamento

### 2. Detalhamento

Visualização detalhada de todos os custos com:
- **Filtros**: Por período, rota, veículo, motorista, categoria
- **Agrupamento**: Por grupo, categoria ou lista simples
- **Ordenação**: Por data, valor ou outros campos
- **Exportação**: CSV, Excel ou PDF

### 3. Conciliação

Conciliação de custos medidos vs faturas recebidas:
- Comparação automática de KM, tempo e viagens
- Detecção de divergências significativas (>5% ou >R$100)
- Aprovação, rejeição ou solicitação de revisão
- Exportação de relatórios de conciliação

### 4. Orçamento & Previsão

Gestão de orçamentos:
- Cadastro de orçamentos mensais por categoria
- Comparação realizado vs orçado
- Visualização de variações percentuais
- Previsões baseadas em tendências

### 5. Centros de Custo

Breakdown de custos por centro de custo (em desenvolvimento)

### 6. Auditoria

Log de todas as operações de custos (em desenvolvimento)

## Categorias de Custos

O sistema organiza custos em 7 grupos principais:

### 1. Operacionais
- Combustível (gasolina, diesel, GNV, etanol)
- Pedágio
- Pneus
- Manutenção (preventiva, corretiva, revisões)
- Peças
- Lubrificantes/Óleo
- Lavagem
- Telemetria
- Licenças
- Seguro Veículo
- Depreciação

### 2. Pessoal Operacional
- Salários (motorista, cobrador, auxiliar)
- Encargos (INSS, FGTS, 13º, férias)
- Benefícios (vale transporte, refeição, planos)
- Hora Extra
- Treinamentos

### 3. Contratuais/Terceiros
- Contratos com transportadoras (por KM/hora/viagem)
- Aluguel/Leasing de veículos
- Terceirizações

### 4. Administrativos
- Aluguel escritório/garagem
- Energia/Água/Gás
- Internet/Telefonia
- Softwares/SaaS
- Contabilidade
- Taxas Bancárias
- Materiais

### 5. Tributários/Regulatórios
- Impostos (ISS, ICMS, IRPJ, CSLL)
- Taxas Regulatórias (ANTT, DPVAT, licenciamento)

### 6. Financeiros
- Juros
- Multas
- Variação Cambial
- Amortização CAPEX

### 7. Eventos/Anomalias
- Incidentes (acidentes, roubo/furto)
- Sinistros
- Avarias
- Multas de Trânsito

## Importação de Custos via CSV

### Formato do Arquivo

O arquivo CSV deve conter as seguintes colunas (algumas opcionais):

```csv
data,categoria,subcategoria,valor,quantidade,unidade,rota,veiculo,motorista,observacoes
2024-01-15,Combustível,Diesel,2500.00,500,litro,Rota Centro,ABC1234,driver@example.com,Abastecimento semanal
```

### Colunas Obrigatórias
- `data`: Data do custo (YYYY-MM-DD)
- `categoria`: Categoria do custo (deve existir no sistema)
- `valor`: Valor do custo (número positivo)

### Colunas Opcionais
- `subcategoria`: Subcategoria específica
- `quantidade`: Quantidade (litros, km, horas, etc.)
- `unidade`: Unidade de medida (litro, km, hora, etc.)
- `rota`: Nome da rota
- `veiculo`: Placa do veículo
- `motorista`: Email do motorista
- `observacoes`: Notas adicionais

### Processo de Importação

1. Acesse a aba de Custos
2. Clique em "Importar CSV"
3. Selecione o arquivo CSV
4. Revise o preview das linhas válidas
5. Corrija erros de validação se necessário
6. Clique em "Importar"

O sistema validará cada linha e importará apenas os custos válidos.

## Adicionar Custo Manual

1. Clique em "Adicionar Custo"
2. Selecione o grupo de custo
3. Selecione a categoria
4. Preencha a data, valor e outras informações
5. Opcionalmente, vincule a uma rota, veículo ou motorista
6. Clique em "Salvar"

## Conciliação de Faturas

### Processo

1. Acesse a aba "Conciliação"
2. Selecione uma fatura pendente
3. Revise os comparativos:
   - KM medido vs KM faturado
   - Tempo medido vs Tempo faturado
   - Viagens medidas vs Viagens faturadas
4. Verifique divergências significativas (destacadas em vermelho)
5. Escolha uma ação:
   - **Aprovar**: Aprova a fatura mesmo com divergências
   - **Rejeitar**: Rejeita a fatura
   - **Solicitar Revisão**: Solicita revisão da transportadora

### Regras de Divergência

Uma divergência é considerada significativa se:
- Diferença absoluta > R$ 100,00 OU
- Diferença percentual > 5%

## Orçamentos

### Criar Orçamento

1. Acesse a aba "Orçamento"
2. Clique em "Adicionar Orçamento"
3. Selecione o mês e ano
4. Digite o valor orçado
5. Opcionalmente, selecione uma categoria específica
6. Clique em "Salvar"

### Visualizar Realizado vs Orçado

A aba de orçamento mostra:
- Gráfico comparativo mensal
- Tabela com valores orçados e realizados
- Variação percentual (positiva ou negativa)
- Indicadores visuais de estouro de orçamento

## KPIs e Cálculos

### Custo por KM
```
Custo/KM = Soma de Custos / Total de KM Medidos
```

### Custo por Viagem
```
Custo/Viagem = Soma de Custos / Número de Viagens
```

### Custo por Passageiro
```
Custo/Passageiro = Soma de Custos / Total de Passageiros Transportados
```

### Variação vs Orçamento
```
Variação % = ((Realizado - Orçado) / Orçado) × 100
```

## Exportação

### Formatos Disponíveis

- **CSV**: Para análise em planilhas
- **Excel**: Para relatórios formataods
- **PDF**: Para apresentações e arquivo

### Filtros Aplicados

Os filtros aplicados na visualização são mantidos na exportação, garantindo que apenas os dados relevantes sejam exportados.

## Permissões

- **Operadores**: Veem apenas custos de suas empresas (via RLS)
- **Admins**: Veem custos de todas as empresas

## Dicas e Boas Práticas

1. **Categorização**: Sempre categorize corretamente os custos para análises precisas
2. **Período**: Use filtros de período para análises específicas
3. **Conciliação**: Revise faturas regularmente para identificar divergências rapidamente
4. **Orçamento**: Mantenha orçamentos atualizados para comparações precisas
5. **Exportação**: Exporte relatórios regularmente para backup e análise externa

## Troubleshooting

### "Nenhum custo encontrado"
- Verifique os filtros aplicados
- Certifique-se de que há custos cadastrados no período selecionado
- Verifique as permissões de acesso à empresa

### "Erro ao importar CSV"
- Verifique o formato do arquivo
- Confirme que as categorias existem no sistema
- Revise os erros de validação exibidos no preview

### "Divergência não detectada"
- Verifique se a fatura está vinculada corretamente aos custos
- Confirme que os dados medidos (KM, tempo, viagens) estão disponíveis
- Revise as regras de divergência (>5% ou >R$100)

## Suporte

Para dúvidas ou problemas, entre em contato com o suporte técnico.

