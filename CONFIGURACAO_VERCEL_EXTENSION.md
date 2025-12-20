# Configuração da Extensão Vercel for VS Code - 20/12/2025

## ✅ Status: Configurada e Corrigida (20/12/2025)

A extensão **Vercel for VS Code by Sodefa** está instalada e configurada com sucesso!

### ⚠️ Correção Aplicada

O token foi atualizado para o token correto do Vercel:
- **Token anterior (inválido)**: `Ao7Xv6TB9X1af7cbDjL2Svt9`
- **Token intermediário**: `V8FJoSMM3um4TfU05Y19PwFa`
- **Token atual (novo, gerado em 20/12/2025)**: `1oIlqDMYnq8roc76Oly57J4m`

### Detalhes da Instalação

- **Extensão**: `weiskopfsodefa.vercel-vscode-by-sodefa`
- **Versão**: 2.0.7
- **Localização**: `~/.cursor/extensions/weiskopfsodefa.vercel-vscode-by-sodefa-2.0.7-universal/`

### Configuração do Token

O token do Vercel já está configurado no arquivo de configurações do Cursor:

**Arquivo**: `~/Library/Application Support/Cursor/User/settings.json`

```json
{
    "vercelVSCode.accessToken": "1oIlqDMYnq8roc76Oly57J4m"
}
```

### Chave de Configuração

A chave de configuração usada pela extensão é:
- `vercelVSCode.accessToken`

## Funcionalidades Disponíveis

Com a extensão configurada, você pode:

- ✅ Visualizar deployments do Vercel diretamente no Cursor
- ✅ Fazer deploy de projetos
- ✅ Gerenciar variáveis de ambiente
- ✅ Visualizar logs
- ✅ Acessar o dashboard do Vercel
- ✅ E muito mais!

## Como Usar

1. **Acessar o painel do Vercel**:
   - Abra a paleta de comandos (Cmd + Shift + P)
   - Digite "Vercel" para ver os comandos disponíveis

2. **Verificar status**:
   - A extensão deve aparecer na barra lateral do Cursor
   - Você verá informações sobre seus projetos Vercel

3. **Fazer deploy**:
   - Use os comandos da extensão para fazer deploy diretamente do Cursor

## Verificação

Para verificar se a extensão está funcionando:

1. Abra o Cursor
2. Pressione `Cmd + Shift + P`
3. Digite "Vercel"
4. Você deve ver comandos como:
   - "Vercel: Deploy"
   - "Vercel: Open Dashboard"
   - "Vercel: Show Output"

## Troubleshooting

Se a extensão não estiver funcionando:

1. **Reinicie o Cursor** completamente (Cmd + Q)
2. **Verifique o token** no arquivo de configurações
3. **Verifique se a extensão está habilitada**:
   - Vá em Extensions (Cmd + Shift + X)
   - Procure por "Vercel"
   - Certifique-se de que está instalada e habilitada

4. **Verifique os logs**:
   - Abra o Output (View > Output)
   - Selecione "Vercel" no dropdown
   - Verifique se há erros

## Segurança

⚠️ **Importante**: O token está armazenado no arquivo de configurações do usuário.

- O token está em: `~/Library/Application Support/Cursor/User/settings.json`
- Mantenha este arquivo seguro
- Não compartilhe o token publicamente
- Se o token for comprometido, revogue-o no painel do Vercel

## Próximos Passos

1. ✅ Extensão instalada
2. ✅ Token configurado e corrigido (20/12/2025)
3. 🔄 **REINICIE O CURSOR COMPLETAMENTE** (Cmd + Q) para aplicar as mudanças
4. Teste a extensão usando os comandos do Vercel

### ⚠️ IMPORTANTE: Após a Correção

Após atualizar o token, você **DEVE**:
1. Fechar completamente o Cursor (Cmd + Q)
2. Reabrir o Cursor
3. Verificar se a extensão Vercel está funcionando sem erros de autorização
4. Se ainda houver erro, verifique os logs da extensão (View > Output > Vercel)

### 🔧 Configuração Adicional (Workspace)

O token também foi configurado no arquivo `.vscode/settings.json` do workspace:
- **Arquivo**: `.vscode/settings.json` (no diretório raiz do projeto)
- Isso garante que a extensão encontre o token mesmo quando o workspace está aberto

**Nota**: A extensão pode procurar o token em:
1. Workspace settings (`.vscode/settings.json`) - ✅ Configurado
2. User settings (`~/Library/Application Support/Cursor/User/settings.json`) - ✅ Configurado

## Referências

- Repositório da extensão: https://github.com/weiskopfsodefa/vercel-vscode
- Documentação do Vercel: https://vercel.com/docs

