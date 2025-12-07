# Como Corrigir o Turbopack no Windows

## Problema

O Turbopack não funciona porque o binário nativo SWC (`@next/swc-win32-x64-msvc`) não está carregando devido a erro de DLL:

```
Attempted to load @next/swc-win32-x64-msvc, but an error occurred: 
Uma rotina de inicialização da biblioteca de vínculo dinâmico (DLL) falhou.
```

## Solução

### 1. Instalar Visual C++ Redistributable CORRETO

**IMPORTANTE:** Você precisa do Visual C++ Redistributable **2015-2022**, não apenas v14.

- **Download:** https://aka.ms/vs/17/release/vc_redist.x64.exe
- Instale a versão **x64** mesmo se tiver Windows de 32 bits (para Node.js)

### 2. Reiniciar o Computador

Após instalar o Visual C++ Redistributable, **REINICIE O COMPUTADOR** para que as novas DLLs sejam carregadas.

### 3. Verificar se o DLL Carrega

Execute o script de diagnóstico:

```bash
cd apps/web
node scripts/diagnose-swc-dll.js
```

### 4. Reativar o Turbopack

Após confirmar que o DLL carrega corretamente:

1. Edite `apps/web/next.config.js`
2. Descomente a linha `turbopack: {},`
3. Remova os comentários sobre desabilitar o Turbopack
4. Salve o arquivo
5. Execute: `npm run dev`

## Solução Temporária (Webpack)

Enquanto o problema do DLL não é resolvido, o servidor funciona com webpack (mais lento):

O Next.js automaticamente usa webpack quando o Turbopack falha. O servidor funciona normalmente, apenas mais lento durante o desenvolvimento.

## Verificação Rápida

Para verificar se o Visual C++ Redistributable está instalado corretamente:

```powershell
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" -ErrorAction SilentlyContinue
```

Ou verifique em:
- **Painel de Controle** → **Programas e Recursos**
- Procure por "Microsoft Visual C++ 2015-2022 Redistributable"

## Notas Técnicas

- O Turbopack **requer** o binário nativo SWC funcionando
- WASM fallback **não funciona** com Turbopack
- Webpack funciona perfeitamente com WASM fallback
- O problema do DLL não afeta builds de produção

