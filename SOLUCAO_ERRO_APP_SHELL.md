# Solução para Erro: Cannot find module '@/components/app-shell'

## Problema
O build no Vercel estava falhando com:
```
Type error: Cannot find module '@/components/app-shell' or its corresponding type declarations.
./app/admin/ajuda-suporte/page.tsx:4:26
```

## Verificações Realizadas
1. ✅ Arquivo existe: `web-app/components/app-shell.tsx`
2. ✅ Export correto: `export function AppShell(...)`
3. ✅ Import correto: `import { AppShell } from "@/components/app-shell"`
4. ✅ tsconfig.json configurado com paths: `"@/*": ["./*"]`
5. ✅ Build local funciona (apenas warnings sobre next/link)
6. ✅ Arquivo está no git: `git ls-files` confirma

## Solução Aplicada
- Mantido export named: `export function AppShell`
- Verificado que todos os imports usam `{ AppShell }` (named import)
- Adicionado comentário no código para clareza
- Arquivo commitado e push realizado

## Próximos Passos
Se o erro persistir no Vercel após o commit:

1. **Verificar TypeScript strictness**: Pode ser necessário ajustar `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node" // ou "bundler"
     }
   }
   ```

2. **Verificar se há problemas de case sensitivity**: Vercel roda em Linux, que é case-sensitive

3. **Clear build cache**: Fazer redeploy sem cache na Vercel

4. **Verificar se Next.js está usando o tsconfig correto**: Pode ser necessário criar um `tsconfig.build.json` específico

## Status Atual
- ✅ Código corrigido localmente
- ✅ Commit realizado
- ⏳ Aguardando build no Vercel

