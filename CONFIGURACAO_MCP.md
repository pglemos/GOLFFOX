# Configuração do MCP Browser no Cursor

## Método 1: Configuração através das Configurações do Cursor (Recomendado)

1. Abra o Cursor
2. Pressione `Ctrl + ,` (ou `Cmd + ,` no Mac) para abrir as configurações
3. Procure por "MCP" ou "Model Context Protocol" na barra de pesquisa
4. Clique em "Edit in settings.json" ou encontre a seção de configuração MCP
5. Adicione a seguinte configuração:

```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp@latest"]
    }
  }
}
```

## Método 2: Configuração via Arquivo de Configuração do Usuário

No Windows, o arquivo de configuração do Cursor geralmente está em:
- `%APPDATA%\Cursor\User\settings.json` ou
- `%USERPROFILE%\.cursor\mcp.json`

1. Abra o arquivo de configurações do Cursor
2. Adicione a configuração acima na seção apropriada

## Método 3: Configuração no Workspace

O arquivo `mcp.json` já foi criado na raiz do projeto. Se o Cursor não detectar automaticamente:

1. Reinicie o Cursor completamente
2. Verifique se o Node.js está instalado: `node --version`
3. Verifique se o npm está instalado: `npm --version`

## Verificação

Após configurar:

1. Reinicie o Cursor
2. Abra o painel de comandos (`Ctrl + Shift + P`)
3. Procure por "MCP" para ver se o servidor está disponível
4. Verifique os logs do Cursor para erros relacionados ao MCP

## Solução de Problemas

- **Erro ao executar npx**: Certifique-se de que o Node.js está instalado e no PATH
- **Servidor não aparece**: Reinicie o Cursor completamente
- **Erro de permissão**: Execute o Cursor como administrador (se necessário)

