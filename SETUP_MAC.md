# Guia de Configuração no Mac

## Instalação do Node.js 22.x

O projeto requer Node.js 22.x. Siga uma das opções abaixo:

### Opção 1: Usando Homebrew (Recomendado)

1. Instale o Homebrew (se não tiver):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Instale o Node.js 22:
```bash
brew install node@22
```

3. Adicione ao PATH (se necessário):
```bash
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Opção 2: Usando nvm (Node Version Manager)

1. Instale o nvm:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

2. Recarregue o shell:
```bash
source ~/.zshrc
```

3. Instale o Node.js 22:
```bash
nvm install 22
nvm use 22
nvm alias default 22
```

### Opção 3: Download Direto

1. Acesse: https://nodejs.org/
2. Baixe a versão 22.x LTS
3. Instale o pacote .pkg

## Verificação

Após instalar, verifique:
```bash
node --version  # Deve mostrar v22.x.x
npm --version   # Deve mostrar >= 9.0.0
```

## Próximos Passos

Após instalar o Node.js:

1. Instale as dependências do projeto:
```bash
cd apps/web
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev:turbo
```

3. Acesse: http://localhost:3000

## Configuração dos MCPs

Os MCPs já foram configurados:
- ✅ Arquivo `mcp.json` criado na raiz do projeto
- ✅ Diretório `~/.cursor` e `memory.json` criados
- ✅ Script `npm run setup:mcp` disponível na raiz

Para reconfigurar os MCPs no futuro:
```bash
npm run setup:mcp
```

## Variáveis de Ambiente

O arquivo `.env.local` já foi criado em `apps/web/.env.local` com:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- ✅ NODE_ENV=development

