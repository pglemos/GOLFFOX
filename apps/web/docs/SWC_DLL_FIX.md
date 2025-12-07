# Correção do Problema SWC DLL no Windows

## Problema Identificado

O Next.js estava falhando ao carregar o binário nativo `@next/swc-win32-x64-msvc` no Windows, resultando no erro:

```
Attempted to load @next/swc-win32-x64-msvc, but an error occurred: 
Uma rotina de inicialização da biblioteca de vínculo dinâmico (DLL) falhou.
```

## Correções Implementadas

### 1. Script de Verificação e Reinstalação Atualizado

**Arquivo:** `apps/web/scripts/ensure-native-binaries.js`

- Adicionada verificação específica para `@next/swc-win32-x64-msvc` no Windows
- Verificação de integridade do arquivo `.node` (tamanho, existência)
- Reinstalação automática de binários corrompidos ou faltando
- Tratamento de erros melhorado com fallback para WASM

### 2. Configuração do Next.js Atualizada

**Arquivo:** `apps/web/next.config.js`

- Removida opção inválida `swcMinify` (não existe no Next.js 16)
- Adicionada documentação sobre fallback WASM
- Configuração do Turbopack documentada

### 3. Script de Diagnóstico Criado

**Arquivo:** `apps/web/scripts/diagnose-swc-dll.js`

- Verifica instalação do pacote SWC
- Verifica integridade do arquivo `.node`
- Verifica versão do Node.js
- Fornece sugestões de correção

## Status Atual

✅ **Binário SWC instalado:** O pacote `@next/swc-win32-x64-msvc` foi reinstalado com sucesso (137.31 MB)

⚠️ **Problema do DLL persiste:** O binário nativo ainda não carrega, mas o Next.js usa WASM como fallback automaticamente

✅ **Servidor funcional:** O servidor de desenvolvimento funciona com WASM fallback (mais lento mas funcional)

## Como Resolver o Problema do DLL

O erro de DLL geralmente indica falta de dependências do sistema. Siga estes passos:

### 1. Instalar Visual C++ Redistributable

Baixe e instale o Visual C++ Redistributable 2015-2022:
- **Link:** https://aka.ms/vs/17/release/vc_redist.x64.exe
- Instale a versão x64 mesmo se tiver Windows de 32 bits (para Node.js)

### 2. Verificar Antivírus

Alguns antivírus bloqueiam arquivos `.node`. Adicione exceção para:
- `F:\GOLFFOX\apps\web\node_modules\@next\swc-win32-x64-msvc\`

### 3. Verificar Permissões

Certifique-se de que tem permissões de leitura/execução no diretório do projeto.

### 4. Reinstalar o Pacote

Execute o script de verificação:
```bash
cd apps/web
node scripts/ensure-native-binaries.js
```

Ou reinstale manualmente:
```bash
cd apps/web
npm install @next/swc-win32-x64-msvc@^16.0.0 --save-optional --force
```

## Uso com WASM Fallback

Se o binário nativo não funcionar, o Next.js automaticamente usa WASM:

- ✅ **Funcional:** O servidor funciona normalmente
- ⚠️ **Performance:** Mais lento durante desenvolvimento (compilação)
- ✅ **Produção:** Build de produção não é afetado

## Comandos Úteis

### Verificar Status do SWC
```bash
cd apps/web
node scripts/diagnose-swc-dll.js
```

### Verificar e Reinstalar Binários
```bash
cd apps/web
node scripts/ensure-native-binaries.js
```

### Limpar e Reinstalar
```bash
cd apps/web
rm -rf .next
rm -rf node_modules/@next/swc-win32-x64-msvc
npm cache clean --force
npm install
```

## Notas Técnicas

- O Next.js 16 usa Turbopack por padrão, que requer binário nativo SWC
- Se o binário falhar, Next.js automaticamente usa webpack com WASM
- WASM é mais lento mas 100% compatível e funcional
- O problema do DLL não afeta builds de produção

## Próximos Passos

1. Instalar Visual C++ Redistributable
2. Verificar se o DLL carrega após instalação
3. Se persistir, usar WASM fallback (já configurado automaticamente)
4. Monitorar performance durante desenvolvimento

