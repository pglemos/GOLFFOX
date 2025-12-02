-- ============================================
-- GolfFox v44.0 - Seed de Categorias de Custos
-- ============================================

-- Inserir todas as categorias de custos nos 7 grupos

-- 1. OPERACIONAIS
INSERT INTO public.gf_cost_categories (group_name, category, subcategory, unit) VALUES
-- Combustível
('operacionais', 'Combustível', 'Gasolina', 'litro'),
('operacionais', 'Combustível', 'Diesel', 'litro'),
('operacionais', 'Combustível', 'GNV', 'm3'),
('operacionais', 'Combustível', 'Etanol', 'litro'),
-- Pedágio
('operacionais', 'Pedágio', 'Pedágio Rodoviário', 'viagem'),
('operacionais', 'Pedágio', 'Estacionamento', 'hora'),
-- Pneus
('operacionais', 'Pneus', 'Troca de Pneus', 'unidade'),
('operacionais', 'Pneus', 'Recauchutagem', 'unidade'),
('operacionais', 'Pneus', 'Alinhamento/Balanceamento', 'servico'),
-- Manutenção
('operacionais', 'Manutenção', 'Manutenção Preventiva', 'servico'),
('operacionais', 'Manutenção', 'Manutenção Corretiva', 'servico'),
('operacionais', 'Manutenção', 'Revisão Periódica', 'servico'),
('operacionais', 'Manutenção', 'Troca de Óleo', 'servico'),
('operacionais', 'Manutenção', 'Troca de Filtros', 'unidade'),
('operacionais', 'Manutenção', 'Troca de Bateria', 'unidade'),
('operacionais', 'Manutenção', 'Troca de Pastilhas/Freios', 'servico'),
-- Peças
('operacionais', 'Peças', 'Peças de Reposição', 'unidade'),
('operacionais', 'Peças', 'Peças de Desgaste', 'unidade'),
-- Lubrificantes/Óleo
('operacionais', 'Lubrificantes', 'Óleo de Motor', 'litro'),
('operacionais', 'Lubrificantes', 'Óleo de Câmbio', 'litro'),
('operacionais', 'Lubrificantes', 'Fluido de Freio', 'litro'),
-- Lavagem
('operacionais', 'Lavagem', 'Lavagem Externa', 'servico'),
('operacionais', 'Lavagem', 'Lavagem Completa', 'servico'),
('operacionais', 'Lavagem', 'Lavagem Interna', 'servico'),
-- Telemetria
('operacionais', 'Telemetria', 'Assinatura Telemetria', 'mes'),
('operacionais', 'Telemetria', 'Manutenção Equipamento', 'servico'),
-- Licenças
('operacionais', 'Licenças', 'Licença de Operação', 'ano'),
('operacionais', 'Licenças', 'Certificado de Inspeção', 'ano'),
-- Seguro Veículo
('operacionais', 'Seguro', 'Seguro Veículo', 'mes'),
('operacionais', 'Seguro', 'Seguro Carga', 'mes'),
-- Depreciação
('operacionais', 'Depreciação', 'Depreciação Veículo', 'mes')
ON CONFLICT (group_name, category, subcategory) DO NOTHING;

-- 2. PESSOAL OPERACIONAL
INSERT INTO public.gf_cost_categories (group_name, category, subcategory, unit) VALUES
-- Salários
('pessoal_operacional', 'Salários', 'Salário Motorista', 'mes'),
('pessoal_operacional', 'Salários', 'Salário Cobrador', 'mes'),
('pessoal_operacional', 'Salários', 'Salário Auxiliar', 'mes'),
-- Encargos
('pessoal_operacional', 'Encargos', 'INSS', 'mes'),
('pessoal_operacional', 'Encargos', 'FGTS', 'mes'),
('pessoal_operacional', 'Encargos', '13º Salário', 'ano'),
('pessoal_operacional', 'Encargos', 'Férias', 'ano'),
('pessoal_operacional', 'Encargos', 'Contribuição Sindical', 'ano'),
-- Benefícios
('pessoal_operacional', 'Benefícios', 'Vale Transporte', 'mes'),
('pessoal_operacional', 'Benefícios', 'Vale Refeição', 'mes'),
('pessoal_operacional', 'Benefícios', 'Plano de Saúde', 'mes'),
('pessoal_operacional', 'Benefícios', 'Plano Odontológico', 'mes'),
-- Hora Extra
('pessoal_operacional', 'Hora Extra', 'Hora Extra Motorista', 'hora'),
('pessoal_operacional', 'Hora Extra', 'Hora Extra Cobrador', 'hora'),
-- Treinamentos
('pessoal_operacional', 'Treinamentos', 'Treinamento Inicial', 'servico'),
('pessoal_operacional', 'Treinamentos', 'Reciclagem', 'servico'),
('pessoal_operacional', 'Treinamentos', 'Cursos Especializados', 'servico')
ON CONFLICT (group_name, category, subcategory) DO NOTHING;

-- 3. CONTRATUAIS/TERCEIROS
INSERT INTO public.gf_cost_categories (group_name, category, subcategory, unit) VALUES
-- Contratos Transportadoras
('contratuais', 'Contratos Transportadoras', 'Por KM', 'km'),
('contratuais', 'Contratos Transportadoras', 'Por Hora', 'hora'),
('contratuais', 'Contratos Transportadoras', 'Por Viagem', 'viagem'),
('contratuais', 'Contratos Transportadoras', 'Valor Fixo Mensal', 'mes'),
-- Aluguel/Leasing
('contratuais', 'Aluguel/Leasing', 'Aluguel de Veículo', 'mes'),
('contratuais', 'Aluguel/Leasing', 'Leasing de Veículo', 'mes'),
-- Terceirizações
('contratuais', 'Terceirizações', 'Terceirização Manutenção', 'servico'),
('contratuais', 'Terceirizações', 'Terceirização Limpeza', 'mes'),
('contratuais', 'Terceirizações', 'Terceirização Segurança', 'mes')
ON CONFLICT (group_name, category, subcategory) DO NOTHING;

-- 4. ADMINISTRATIVOS
INSERT INTO public.gf_cost_categories (group_name, category, subcategory, unit) VALUES
-- Aluguel
('administrativos', 'Aluguel', 'Aluguel Escritório', 'mes'),
('administrativos', 'Aluguel', 'Aluguel Garagem', 'mes'),
-- Energia/Água
('administrativos', 'Utilidades', 'Energia Elétrica', 'mes'),
('administrativos', 'Utilidades', 'Água', 'mes'),
('administrativos', 'Utilidades', 'Gás', 'mes'),
-- Internet/Telefonia
('administrativos', 'Comunicação', 'Internet', 'mes'),
('administrativos', 'Comunicação', 'Telefonia Fixa', 'mes'),
('administrativos', 'Comunicação', 'Telefonia Móvel', 'mes'),
-- Softwares/SaaS
('administrativos', 'Softwares', 'Sistema de Gestão', 'mes'),
('administrativos', 'Softwares', 'ERP', 'mes'),
('administrativos', 'Softwares', 'Cloud Storage', 'mes'),
-- Contabilidade
('administrativos', 'Contabilidade', 'Honorários Contábeis', 'mes'),
('administrativos', 'Contabilidade', 'Auditoria', 'ano'),
-- Taxas Bancárias
('administrativos', 'Taxas Bancárias', 'Tarifa Bancária', 'mes'),
('administrativos', 'Taxas Bancárias', 'Taxa de Emissão', 'transacao'),
-- Materiais
('administrativos', 'Materiais', 'Material de Escritório', 'mes'),
('administrativos', 'Materiais', 'Material de Limpeza', 'mes')
ON CONFLICT (group_name, category, subcategory) DO NOTHING;

-- 5. TRIBUTÁRIOS/REGULATÓRIOS
INSERT INTO public.gf_cost_categories (group_name, category, subcategory, unit) VALUES
-- Impostos
('tributarios', 'Impostos', 'ISS', 'mes'),
('tributarios', 'Impostos', 'ICMS', 'mes'),
('tributarios', 'Impostos', 'IRPJ', 'mes'),
('tributarios', 'Impostos', 'CSLL', 'mes'),
-- Taxas Regulatórias
('tributarios', 'Taxas Regulatórias', 'Taxa ANTT', 'ano'),
('tributarios', 'Taxas Regulatórias', 'DPVAT', 'ano'),
('tributarios', 'Taxas Regulatórias', 'Licenciamento', 'ano'),
('tributarios', 'Taxas Regulatórias', 'Emplacamento', 'servico')
ON CONFLICT (group_name, category, subcategory) DO NOTHING;

-- 6. FINANCEIROS
INSERT INTO public.gf_cost_categories (group_name, category, subcategory, unit) VALUES
-- Juros
('financeiros', 'Juros', 'Juros de Empréstimo', 'mes'),
('financeiros', 'Juros', 'Juros de Financiamento', 'mes'),
('financeiros', 'Juros', 'Juros de Cartão', 'mes'),
-- Multas
('financeiros', 'Multas', 'Multa Financeira', 'ocorrencia'),
('financeiros', 'Multas', 'Multa Atraso Pagamento', 'ocorrencia'),
-- Variação Cambial
('financeiros', 'Variação Cambial', 'Variação Cambial', 'mes'),
-- Amortização CAPEX
('financeiros', 'Amortização', 'Amortização CAPEX', 'mes')
ON CONFLICT (group_name, category, subcategory) DO NOTHING;

-- 7. EVENTOS/ANOMALIAS
INSERT INTO public.gf_cost_categories (group_name, category, subcategory, unit) VALUES
-- Incidentes
('eventos', 'Incidentes', 'Acidente Veículo', 'ocorrencia'),
('eventos', 'Incidentes', 'Roubo/Furto', 'ocorrencia'),
('eventos', 'Incidentes', 'Quebra de Vidro', 'ocorrencia'),
-- Sinistros
('eventos', 'Sinistros', 'Sinistro Seguro', 'ocorrencia'),
('eventos', 'Sinistros', 'Franquia Seguro', 'ocorrencia'),
-- Avarias
('eventos', 'Avarias', 'Reparo Avaria', 'servico'),
('eventos', 'Avarias', 'Substituição Peça Avaria', 'unidade'),
-- Multas de Trânsito
('eventos', 'Multas de Trânsito', 'Multa por Motorista', 'ocorrencia'),
('eventos', 'Multas de Trânsito', 'Multa por Veículo', 'ocorrencia'),
('eventos', 'Multas de Trânsito', 'Pontuação CNH', 'ocorrencia')
ON CONFLICT (group_name, category, subcategory) DO NOTHING;

COMMENT ON TABLE public.gf_cost_categories IS 'Categorias de custos completas - 7 grupos principais com subcategorias detalhadas';

