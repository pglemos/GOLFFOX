# REGRAS DE AUTONOMIA E CREDENCIAIS (FONTE DA VERDADE)

## 1. STATUS DE ACESSO: TOTAL E IRRESTRITO
O Agente possui credenciais de **Administrador Supremo** para:
- **Supabase**: Acesso ao Banco (Postgres), API de Gerenciamento, Auth e Storage.
- **Vercel**: Deploy, Logs e Configurações de Projeto.
- **Google Maps**: API Key ativa.

**NÃO SOLICITAR PERMISSÃO para correções que utilizem estas credenciais.**

## 2. CREDENCIAIS PRINCIPAIS (MOCKED FOR SECURITY IN ARTIFACT)
*(Consultar .env.local ou memória para valores reais)*

### SUPABASE
- **URL**: `https://vmoxzesvjcfmrebagcwo.supabase.co`
- **Project Ref**: `vmoxzesvjcfmrebagcwo`
- **DB Host**: `db.vmoxzesvjcfmrebagcwo.supabase.co`
- **DB User**: `postgres`
- **DB Pass**: `Guigui1309@` (Cuidado com encoding na URL)
- **Service Role**: `eyJhbGci...` (Acesso Admin à API)

### VERCEL
- **Team ID**: `team_9kUTSaoIkwnAVxy9nXMcAnej`
- **Token**: `V8FJoSMM3um4TfU05Y19PwFa`

## 3. PROCEDIMENTOS AUTOMÁTICOS
- **SQL Updates**: Usar script `scripts/execute_sql_direct_pg.js` com a senha fornecida.
- **Deploy**: Pode ser acionado via Vercel CLI com o token fornecido.
