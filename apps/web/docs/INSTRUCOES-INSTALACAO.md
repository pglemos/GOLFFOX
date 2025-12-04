# Instruções de Instalação - Dependências Atualizadas

## ✅ Status: Atualizações Aplicadas ao package.json

Todas as atualizações foram aplicadas. Agora você precisa instalar as dependências.

## Passo a Passo

### 1. Instalar Dependências

```bash
cd apps/web
npm install
```

Isso instalará todas as versões atualizadas das bibliotecas.

### 2. Instalar Browsers do Playwright

Após a instalação do npm, instale os browsers do Playwright:

```bash
npx playwright install
```

### 3. Validar Instalação

Execute os seguintes comandos para validar:

```bash
# Verificar tipos TypeScript
npm run type-check

# Fazer build de produção
npm run build

# Executar testes unitários
npm test

# Executar testes E2E (após instalar browsers)
npm run test:e2e
```

### 4. Testar Aplicação

```bash
npm run dev
```

Acesse `http://localhost:3000` e verifique que tudo funciona.

## Resumo das Atualizações

- ✅ Radix UI: 14 pacotes atualizados
- ✅ Framer Motion: 11.15.0 → 11.18.2
- ✅ TanStack Query: 5.62.2 → 5.90.11
- ✅ Zustand: 5.0.2 → 5.0.9
- ✅ Jest: 29.7.0 → 30.2.0 (major)
- ✅ Playwright: 1.48.2 → 1.57.0
- ✅ Web Vitals: Já atualizado (5.1.0)
- ✅ @vis.gl/react-google-maps: Adicionado (1.7.1)

## Próximos Passos

1. Instalar dependências (`npm install`)
2. Validar através de testes
3. Testar aplicação localmente
4. Fazer deploy (quando tudo estiver validado)

## Documentação

Consulte os arquivos em `apps/web/docs/` para mais detalhes sobre as atualizações.

