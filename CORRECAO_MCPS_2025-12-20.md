# Correção dos MCPs - 20/12/2025

## Problemas Identificados

### 1. **Cache do npx corrompido**
- **Erro**: `ERR_MODULE_NOT_FOUND` para Sequential Thinking e context7
- **Causa**: Cache do npx com módulos incompletos ou corrompidos
- **Solução**: Limpeza completa do cache `~/.npm/_npx/*`

### 2. **Comando incorreto do Playwright**
- **Erro**: "No server info found" inicialmente
- **Causa**: Uso do pacote `@executeautomation/playwright-mcp-server` (antigo)
- **Solução**: Atualizado para `@playwright/mcp@latest` (oficial)

### 3. **Cache do browsermcp**
- **Erro**: `ENOTEMPTY: directory not empty` no cache do npx
- **Causa**: Cache corrompido do browsermcp
- **Solução**: Limpeza do cache resolveu o problema

### 4. **PATH duplicado**
- **Problema**: PATH do Node.js aparecendo duplicado no mcp.json
- **Solução**: Melhorada a detecção do PATH no script de setup

## Correções Aplicadas

### 1. Limpeza do Cache do npx
```bash
rm -rf ~/.npm/_npx/*
```

### 2. Atualização do Script de Setup
- ✅ Corrigido comando do Playwright: `@playwright/mcp@latest`
- ✅ Melhorada detecção do PATH do Node.js (usando `which node`)
- ✅ Removida duplicação do PATH no mcp.json

### 3. Arquivo mcp.json Atualizado
- ✅ Playwright agora usa o pacote oficial
- ✅ PATH otimizado (sem duplicações)
- ✅ Todos os MCPs configurados corretamente

## Status dos MCPs

### ✅ Funcionando Corretamente:
- Puppeteer
- GitHub
- Google Maps
- Memory
- PostgreSQL
- Chrome DevTools MCP
- supabase
- Filesystem
- shadcn-ui

### ✅ Corrigidos:
- **Playwright** - Comando atualizado para `@playwright/mcp@latest`
- **Sequential Thinking** - Cache limpo, deve funcionar após reiniciar
- **context7** - Cache limpo, deve funcionar após reiniciar
- **browsermcp** - Cache limpo, deve funcionar após reiniciar

### ⚠️ Observações:
- **cursor-browser-extension** e **cursor-ide-browser** - Não estão no mcp.json (são extensões do Cursor, não MCPs configuráveis)
- Alguns MCPs podem mostrar "No server info found" inicialmente até que o servidor seja iniciado pela primeira vez

## Próximos Passos

1. **Reiniciar o Cursor completamente** (Cmd + Q)
2. Os MCPs devem ser detectados automaticamente do arquivo `~/.cursor/mcp.json`
3. Verificar os MCPs em: Cursor Settings (Cmd + ,) > MCP
4. Se ainda houver problemas, verificar os logs em:
   ```bash
   ~/Library/Application Support/Cursor/logs/*/window*/exthost/anysphere.cursor-mcp/*.log
   ```

## Comandos Úteis

```bash
# Limpar cache do npx (se necessário novamente)
rm -rf ~/.npm/_npx/*

# Reconfigurar MCPs
cd /Users/pedroguilherme/PROJETO/GOLFFOX/GOLFFOX
node scripts/setup_mcp_mac.js

# Verificar logs do Cursor
tail -f ~/Library/Application\ Support/Cursor/logs/*/window*/exthost/anysphere.cursor-mcp/*.log
```

## Arquivos Modificados

1. `scripts/setup_mcp_mac.js` - Corrigido comando do Playwright e detecção do PATH
2. `~/.cursor/mcp.json` - Atualizado com as correções

