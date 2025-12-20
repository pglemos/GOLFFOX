# Diagnóstico e Correção dos MCPs

## Problema Identificado

### Erro nos Logs do Cursor:
```
[error] Client error for command A system error occurred (spawn npx ENOENT)
[error] No server info found
```

### Causa Raiz:
- **Node.js/npm não estava no PATH do Cursor**
- O Node.js foi instalado via `nvm`, mas o Cursor não carrega o `.zshrc` automaticamente
- Quando o Cursor tenta executar `npx` para iniciar os servidores MCP, ele não encontra o comando

### MCPs Afetados:
Todos os MCPs que usam `npx` estavam falhando:
- ❌ Puppeteer
- ❌ GitHub
- ❌ Google Maps
- ❌ Memory
- ❌ Playwright
- ❌ Sequential Thinking
- ❌ shadcn-ui
- ❌ context7
- ❌ PostgreSQL
- ❌ Chrome DevTools MCP
- ❌ Filesystem
- ✅ Supabase (funcionando - usa URL, não precisa de npx)

## Solução Aplicada

### 1. Configuração do NVM no .zshrc
Adicionado ao `~/.zshrc`:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### 2. Atualização do mcp.json
Adicionado `PATH` nas variáveis de ambiente de cada MCP que usa `npx`:

```json
{
  "env": {
    "PATH": "/Users/pedroguilherme/.nvm/versions/node/v22.21.1/bin:..."
  }
}
```

Isso garante que quando o Cursor executar os servidores MCP, eles terão acesso ao `npx` e `node`.

### 3. Script Atualizado
O script `scripts/setup_mcp_mac.js` foi atualizado para:
- Detectar automaticamente o caminho do Node.js
- Adicionar o PATH nas variáveis de ambiente de todos os MCPs
- Manter compatibilidade com diferentes versões do Node.js

## Status Atual

### ✅ Corrigido:
- PATH adicionado em todos os MCPs que usam `npx`
- Script de configuração atualizado
- NVM configurado no `.zshrc`

### ⏳ Pendente:
- **Reiniciar o Cursor completamente** para aplicar as mudanças
- Após reiniciar, todos os MCPs devem funcionar

## Como Verificar Após Reiniciar

1. Reinicie o Cursor completamente (Cmd + Q)
2. Verifique os logs em: `~/Library/Application Support/Cursor/logs/`
3. Teste os MCPs usando as ferramentas disponíveis
4. Se ainda houver erros, verifique se o caminho do Node.js está correto

## Comandos Úteis

```bash
# Verificar caminho do Node.js
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh" && which node

# Reconfigurar MCPs
cd /Users/pedroguilherme/PROJETO/GOLFFOX/GOLFFOX
npm run setup:mcp

# Verificar logs do Cursor
tail -f ~/Library/Application\ Support/Cursor/logs/*/window*/exthost/anysphere.cursor-mcp/*.log
```


