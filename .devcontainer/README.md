# Dev Container Configuration

## Status Atual

O Dev Container está **desabilitado** para desenvolvimento local no Mac, pois o Docker não está instalado.

O arquivo `devcontainer.json` foi renomeado para `devcontainer.json.disabled` para evitar que o Cursor tente abrir o projeto em um container.

## Quando Usar Dev Container

O Dev Container é útil para:
- **GitHub Codespaces**: Desenvolvimento em ambiente cloud
- **Ambiente isolado**: Quando você precisa de um ambiente de desenvolvimento completamente isolado
- **Flutter**: Se você precisar trabalhar com Flutter e não tiver instalado localmente

## Como Reativar

### Opção 1: Instalar Docker Desktop (Recomendado para uso local)

1. Baixe o Docker Desktop para Mac: https://www.docker.com/products/docker-desktop/
2. Instale e inicie o Docker Desktop
3. Renomeie o arquivo:
   ```bash
   mv .devcontainer/devcontainer.json.disabled .devcontainer/devcontainer.json
   ```
4. Reinicie o Cursor
5. Quando solicitado, escolha "Reopen in Container"

### Opção 2: Usar GitHub Codespaces

1. Acesse o repositório no GitHub
2. Clique em "Code" > "Codespaces" > "Create codespace"
3. O Dev Container será configurado automaticamente

## Desenvolvimento Local (Atual)

Para desenvolvimento local no Mac, você pode usar:

- **Node.js**: Já configurado via nvm (v22.21.1)
- **Next.js**: Execute `npm run dev:turbo` em `apps/web`
- **MCPs**: Configurados em `~/.cursor/mcp.json`

Não é necessário Docker para desenvolvimento local do Next.js.

