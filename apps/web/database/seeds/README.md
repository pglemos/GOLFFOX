# Seeds de Dados - GolfFox

Este diretório contém scripts SQL para popular o banco de dados com dados essenciais e de demonstração.

## Como Usar

### Opção 1: Via npm (recomendado)

Se você tem `DATABASE_URL` configurada no `.env`:

```bash
cd web-app
npm run db:seed:demo
```

### Opção 2: Via SQL Editor do Supabase

Se você não tem `DATABASE_URL` configurada ou prefere executar manualmente:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Crie uma nova query
5. Cole o conteúdo do arquivo SQL desejado
6. Execute a query

## Scripts Disponíveis

### `essential_cost_categories.sql`

**Propósito:** Cria as categorias de custo essenciais para o sistema funcionar corretamente.

**Quando usar:**
- Após executar as migrations iniciais
- Quando necessário criar categorias de custo para testes
- Para ambiente de desenvolvimento/testes

**Categorias criadas:**
1. Combustível
2. Manutenção
3. Pessoal
4. Seguros
5. Licenciamento
6. Pneus
7. Lavagem e Limpeza
8. Depreciação
9. Outros

**Como executar:**
```sql
-- Cole o conteúdo de essential_cost_categories.sql no SQL Editor do Supabase
```

### `demo-data.sql` (se existir)

Dados de demonstração completos incluindo empresas, veículos, motoristas, rotas, etc.

## Verificação

Após executar os seeds, verifique se os dados foram inseridos:

```sql
-- Verificar categorias de custo
SELECT count(*) as total_categorias 
FROM gf_cost_categories 
WHERE is_active = true;

-- Deve retornar: 9 categorias
```

## Troubleshooting

### Erro: "relation gf_cost_categories does not exist"

**Solução:** Execute as migrations primeiro:
```bash
# Verifique os arquivos em database/migrations/
# Execute no Supabase SQL Editor
```

### Erro: "permission denied"

**Solução:** Certifique-se de estar usando a Service Role Key ou executando como administrador no Supabase Dashboard.

### Categorias duplicadas

**Solução:** O script usa `ON CONFLICT` para evitar duplicatas. Se houver erro, você pode limpar as categorias existentes:
```sql
DELETE FROM gf_cost_categories;
-- Depois execute o seed novamente
```

## Dados de Produção

⚠️ **ATENÇÃO:** Estes seeds são para desenvolvimento e testes. Para produção:
1. Não use IDs fixos (deixe o PostgreSQL gerar)
2. Ajuste os valores conforme necessário
3. Considere usar migrations ao invés de seeds

## Suporte

Se encontrar problemas, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [README principal do projeto](../../README.md)

