# Troubleshooting - Turbopack

## Problema: `turbo.createProject is not supported by the wasm bindings`

### Causa

O Turbopack requer o binário nativo do SWC (`@next/swc-win32-x64-msvc`) para funcionar. Quando o binário nativo não consegue ser carregado (erro de DLL), o Next.js tenta usar WASM bindings como fallback, mas o Turbopack **não suporta WASM**.

### Sintomas

```
⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred: Uma rotina de inicialização da biblioteca de vínculo dinâmico (DLL) falhou.
Error: `turbo.createProject` is not supported by the wasm bindings.
```

### Soluções

#### Solução 1: Usar Webpack (Recomendado para Desenvolvimento) ✅

O script `dev` padrão agora usa webpack por padrão:

```bash
npm run dev
```

Isso usa a flag `--webpack` para garantir que o webpack seja usado, que funciona tanto com binário nativo quanto com WASM.

**Nota**: No Next.js 16, a flag correta é `--webpack` (não `--no-turbo`).

#### Solução 2: Tentar Turbopack (Se o Binário Estiver Funcionando)

Se você quiser tentar usar Turbopack (mais rápido quando funciona):

```bash
npm run dev:turbo
```

#### Solução 3: Corrigir o Binário Nativo

1. **Reinstalar o binário**:
   ```bash
   npm install --force @next/swc-win32-x64-msvc
   ```

2. **Verificar dependências do sistema**:
   - Visual C++ Redistributable instalado
   - Permissões de leitura no diretório `node_modules`

3. **Limpar e reinstalar**:
   ```bash
   rm -rf node_modules/.cache
   rm -rf .next
   npm install
   ```

### Impacto

- **Webpack**: Funciona perfeitamente, mas pode ser um pouco mais lento que Turbopack
- **Turbopack**: Mais rápido quando funciona, mas requer binário nativo do SWC

### Build de Produção

O build de produção (`npm run build`) funciona normalmente, pois o Next.js gerencia automaticamente o bundler baseado na disponibilidade do binário nativo.

### Notas

- O Turbopack é uma feature experimental do Next.js 16
- Webpack continua sendo totalmente suportado e estável
- A performance do webpack é adequada para desenvolvimento
- Em produção, o Next.js escolhe automaticamente o melhor bundler disponível

